"""
Attestation ledger.

Records the 3-party attestation chain (complainant / bank / police) per
complaint. Two implementations behind the same interface:

  - InMemoryHashChainLedger: real, runnable offline. Implements the two
    properties that actually matter for the "how do you know it's real"
    argument - append-only and tamper-evident - via a genuine SHA-256 hash
    chain (each record's hash includes the previous record's hash, so
    altering any past record breaks every hash after it). This is NOT a
    blockchain (no consensus, no distributed nodes) - it's the minimum
    real cryptographic structure that demonstrates the same tamper-evidence
    property for an offline demo.

  - FabricLedger: production implementation, submits transactions to a
    Hyperledger Fabric channel via the Fabric Gateway SDK. Requires a
    running Fabric network (see infra/fabric/) - not executed in this
    sandbox, written to match infra/fabric/chaincode/attestation.go.
"""

import hashlib
import json
import time
from abc import ABC, abstractmethod
from dataclasses import asdict, dataclass
from enum import Enum


class AttestorRole(str, Enum):
    COMPLAINANT = "complainant"
    BANK = "bank"
    POLICE = "police"


@dataclass
class Attestation:
    complaint_id: str
    role: AttestorRole
    signature: str          # in production: a real digital signature; here, a placeholder identity token
    timestamp: float
    prev_hash: str = ""
    record_hash: str = ""


class Ledger(ABC):
    @abstractmethod
    def attest(self, complaint_id: str, role: AttestorRole, signature: str) -> Attestation: ...

    @abstractmethod
    def attestation_count(self, complaint_id: str) -> int: ...

    @abstractmethod
    def verify_chain(self) -> bool:
        """Returns False if any record's hash doesn't match its recomputed value -
        i.e. tamper detection."""
        ...


from pathlib import Path


class InMemoryHashChainLedger(Ledger):
    """
    Append-only, tamper-evident cryptographic ledger backed by disk serialization (.ledger.jsonl).
    Survives container/process restarts so audit chains remain verifiable during live pitch presentations.
    """

    def __init__(self, storage_path: str | Path | None = None):
        self._chain: list[Attestation] = []
        if storage_path is None:
            self._storage_path = Path(__file__).resolve().parents[2] / ".ledger.jsonl"
        elif str(storage_path) == ":memory:":
            self._storage_path = None
        else:
            self._storage_path = Path(storage_path)

        if self._storage_path and self._storage_path.exists():
            self._rehydrate()

    def _rehydrate(self) -> None:
        """Rehydrates the in-memory hash chain from local disk append log."""
        try:
            with open(self._storage_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    item = json.loads(line)
                    record = Attestation(
                        complaint_id=item["complaint_id"],
                        role=AttestorRole(item["role"]),
                        signature=item["signature"],
                        timestamp=item["timestamp"],
                        prev_hash=item.get("prev_hash", ""),
                        record_hash=item.get("record_hash", ""),
                    )
                    self._chain.append(record)
        except Exception:
            pass

    def _hash_record(self, complaint_id: str, role: AttestorRole, signature: str,
                      timestamp: float, prev_hash: str) -> str:
        payload = json.dumps({
            "complaint_id": complaint_id, "role": role.value, "signature": signature,
            "timestamp": timestamp, "prev_hash": prev_hash,
        }, sort_keys=True).encode()
        return hashlib.sha256(payload).hexdigest()

    def attest(self, complaint_id: str, role: AttestorRole, signature: str) -> Attestation:
        # One attestation per (complaint, role) - a bank can't attest twice as itself
        # and can't forge a complainant attestation because it doesn't hold that identity token.
        existing = [a for a in self._chain if a.complaint_id == complaint_id and a.role == role]
        if existing:
            raise ValueError(f"{role.value} has already attested complaint {complaint_id}")

        prev_hash = self._chain[-1].record_hash if self._chain else "genesis"
        timestamp = time.time()
        record_hash = self._hash_record(complaint_id, role, signature, timestamp, prev_hash)
        record = Attestation(complaint_id=complaint_id, role=role, signature=signature,
                              timestamp=timestamp, prev_hash=prev_hash, record_hash=record_hash)
        self._chain.append(record)

        # Durably append record to disk log (survives reboot/crash)
        if self._storage_path:
            try:
                self._storage_path.parent.mkdir(parents=True, exist_ok=True)
                with open(self._storage_path, "a", encoding="utf-8") as f:
                    f.write(json.dumps(asdict(record)) + "\n")
            except Exception:
                pass

        return record

    def clear(self) -> None:
        """Clears memory chain and wipes disk persistence file."""
        self._chain = []
        if self._storage_path and self._storage_path.exists():
            try:
                self._storage_path.unlink()
            except Exception:
                pass

    def attestation_count(self, complaint_id: str) -> int:
        return len({a.role for a in self._chain if a.complaint_id == complaint_id})

    def verify_chain(self) -> bool:
        prev_hash = "genesis"
        for record in self._chain:
            expected = self._hash_record(record.complaint_id, record.role, record.signature,
                                          record.timestamp, prev_hash)
            if expected != record.record_hash or record.prev_hash != prev_hash:
                return False
            prev_hash = record.record_hash
        return True

    def tamper_with(self, index: int, new_signature: str) -> None:
        """Test-only: mutates a past record directly (bypassing .attest) to
        demonstrate that verify_chain() catches it. Never exposed via any API route."""
        self._chain[index].signature = new_signature


class FabricLedger(Ledger):
    """
    Production implementation. Requires the Fabric Gateway SDK and a running
    Hyperledger Fabric network with the Platform/Bank/LEA orgs from
    infra/fabric/network-config.yaml, and the chaincode in
    infra/fabric/chaincode/attestation.go installed on the channel.
    Not executed in this sandbox.
    """

    def __init__(self, gateway, channel_name: str, chaincode_name: str = "attestation"):
        self._network = gateway.get_network(channel_name)
        self._contract = self._network.get_contract(chaincode_name)

    def attest(self, complaint_id: str, role: AttestorRole, signature: str) -> Attestation:
        result = self._contract.submit_transaction(
            "CreateAttestation", complaint_id, role.value, signature, str(time.time()),
        )
        data = json.loads(result)
        return Attestation(**data)

    def attestation_count(self, complaint_id: str) -> int:
        result = self._contract.evaluate_transaction("GetAttestationCount", complaint_id)
        return int(result)

    def verify_chain(self) -> bool:
        # Fabric's ordering service + peer endorsement policy provide tamper-evidence
        # natively; this calls a chaincode query that re-validates block hashes.
        result = self._contract.evaluate_transaction("VerifyLedgerIntegrity")
        return json.loads(result)["valid"]


if __name__ == "__main__":
    ledger = InMemoryHashChainLedger(storage_path=":memory:")
    ledger.attest("C-001", AttestorRole.COMPLAINANT, "otp_verified:9876543210")
    ledger.attest("C-001", AttestorRole.BANK, "utr_matched:UTR001")
    print(f"Attestation count for C-001: {ledger.attestation_count('C-001')}")
    print(f"Chain valid: {ledger.verify_chain()}")
    assert ledger.attestation_count("C-001") == 2
    assert ledger.verify_chain() is True

    ledger.tamper_with(0, "FORGED_SIGNATURE")
    print(f"Chain valid after tampering with record 0: {ledger.verify_chain()}")
    assert ledger.verify_chain() is False, "tampering must be detectable"
    print("OK: hash chain correctly detects tampering")
