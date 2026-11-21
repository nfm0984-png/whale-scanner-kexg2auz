#!/usr/bin/env python3
"""Passcode hash + AES-256-GCM helpers for the whale scanner. Never prints the passcode."""
from __future__ import annotations

import base64, hashlib, json, os, secrets, sys

ITERS = 100000
SALT_LEN = 16
IV_LEN = 12
KEY_LEN = 32
TAG_LEN = 16
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GATE_PATH = os.path.join(ROOT, "gate.json")
# Files the public Pages site (and root copies) load or expose as scan output.
PUBLISH = [
    os.path.join(ROOT, "data.json"),
    os.path.join(ROOT, "kalshi_display.json"),
    os.path.join(ROOT, "proven_picks.json"),
    os.path.join(ROOT, "scanner", "proven_picks.json"),
]


def _passcode() -> bytes:
    v = os.environ.get("KALSHI_SCANNER_PASSCODE")
    if not v:
        raise SystemExit("KALSHI_SCANNER_PASSCODE is not set")
    return v.encode("utf-8")


def auth_hash(salt: bytes, pw: bytes) -> str:
    return hashlib.sha256(salt + b"\0" + pw).hexdigest()


def derive_key(salt: bytes, pw: bytes, iters: int = ITERS) -> bytes:
    return hashlib.pbkdf2_hmac("sha256", pw, salt, int(iters), dklen=KEY_LEN)


def load_gate() -> dict:
    with open(GATE_PATH, encoding="utf-8") as f:
        return json.load(f)


def is_encrypted(obj) -> bool:
    return isinstance(obj, dict) and obj.get("enc") == 1 and obj.get("ct")


def init_gate() -> dict:
    pw = _passcode()
    if os.path.exists(GATE_PATH):
        gate = load_gate()
        salt = bytes.fromhex(gate["salt"])
        digest = auth_hash(salt, pw)
        if not secrets.compare_digest(digest, gate.get("hash") or ""):
            raise SystemExit("passcode does not match existing gate.json")
        return gate
    salt = secrets.token_bytes(SALT_LEN)
    gate = {
        "v": 1,
        "salt": salt.hex(),
        "hash": auth_hash(salt, pw),
        "iters": ITERS,
        "kdf": "pbkdf2-sha256",
        "wrap": "aes-256-gcm",
    }
    with open(GATE_PATH, "w", encoding="utf-8") as f:
        json.dump(gate, f, indent=2)
        f.write("\n")
    print("wrote gate.json (salt+hash only)", file=sys.stderr)
    return gate


def load_plain_obj(path: str, pw: bytes | None = None):
    with open(path, encoding="utf-8") as f:
        obj = json.load(f)
    if is_encrypted(obj):
        return decrypt_obj(obj, pw)
    return obj


def encrypt_data_file(path: str) -> bool:
    """Encrypt a plaintext JSON file in place. Returns True if a file was encrypted."""
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM

    if not os.path.exists(path):
        return False
    with open(path, encoding="utf-8") as f:
        raw = f.read()
    obj = json.loads(raw)
    if is_encrypted(obj):
        print(os.path.relpath(path, ROOT), "already encrypted", file=sys.stderr)
        return False
    gate = load_gate()
    pw = _passcode()
    salt = bytes.fromhex(gate["salt"])
    iters = int(gate.get("iters") or ITERS)
    if not secrets.compare_digest(auth_hash(salt, pw), gate.get("hash") or ""):
        raise SystemExit("passcode does not match gate.json hash")
    key = derive_key(salt, pw, iters)
    iv = secrets.token_bytes(IV_LEN)
    packed = AESGCM(key).encrypt(iv, raw.encode("utf-8"), None)
    ct, tag = packed[:-TAG_LEN], packed[-TAG_LEN:]
    out = {
        "enc": 1,
        "v": 1,
        "iv": base64.b64encode(iv).decode("ascii"),
        "ct": base64.b64encode(ct).decode("ascii"),
        "tag": base64.b64encode(tag).decode("ascii"),
    }
    with open(path, "w", encoding="utf-8") as f:
        json.dump(out, f, separators=(",", ":"))
        f.write("\n")
    print("encrypted", os.path.relpath(path, ROOT), file=sys.stderr)
    return True


def decrypt_obj(obj: dict, pw: bytes | None = None) -> dict:
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM

    if not is_encrypted(obj):
        return obj
    gate = load_gate()
    pw = pw if pw is not None else _passcode()
    salt = bytes.fromhex(gate["salt"])
    iters = int(gate.get("iters") or ITERS)
    key = derive_key(salt, pw, iters)
    iv = base64.b64decode(obj["iv"])
    ct = base64.b64decode(obj["ct"])
    tag = base64.b64decode(obj["tag"])
    plain = AESGCM(key).decrypt(iv, ct + tag, None)
    return json.loads(plain.decode("utf-8"))


def decrypt_data_file(path: str) -> bool:
    """Decrypt an AES-wrapped JSON file in place. Returns True if a file was unwrapped."""
    if not os.path.exists(path):
        return False
    with open(path, encoding="utf-8") as f:
        obj = json.load(f)
    if not is_encrypted(obj):
        return False
    plain = decrypt_obj(obj)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(plain, f, separators=(",", ":"), ensure_ascii=False)
        f.write("\n")
    print("unwrapped", os.path.relpath(path, ROOT), file=sys.stderr)
    return True


def any_encrypted(paths) -> bool:
    for path in paths:
        if not os.path.exists(path):
            continue
        try:
            with open(path, encoding="utf-8") as f:
                obj = json.load(f)
        except Exception:
            continue
        if is_encrypted(obj):
            return True
    return False


def any_plain(paths) -> bool:
    for path in paths:
        if not os.path.exists(path):
            continue
        try:
            with open(path, encoding="utf-8") as f:
                obj = json.load(f)
        except Exception:
            continue
        if not is_encrypted(obj):
            return True
    return False


def verify_from_env() -> int:
    """Check wrong/right passcode and decrypt. Prints only status, never the code or pick bodies."""
    gate = load_gate()
    pw = _passcode()
    salt = bytes.fromhex(gate["salt"])
    good = secrets.compare_digest(auth_hash(salt, pw), gate.get("hash") or "")
    bad = secrets.compare_digest(auth_hash(salt, b"__wrong_passcode__"), gate.get("hash") or "")
    print("hash_match_correct", "yes" if good else "no")
    print("hash_match_wrong", "yes" if bad else "no")
    if not good:
        return 2
    path = os.path.join(ROOT, "data.json")
    with open(path, encoding="utf-8") as f:
        obj = json.load(f)
    if not is_encrypted(obj):
        print("data_encrypted", "no")
        print("ts", (obj or {}).get("ts"))
        return 0
    data = decrypt_obj(obj, pw)
    print("data_encrypted", "yes")
    print("decrypt", "ok")
    print("ts", (data or {}).get("ts"))
    print("scannedAt", (data or {}).get("scannedAt") or "")
    print("signals", (data or {}).get("totalSignals") or len((data or {}).get("signals") or []))
    return 0


def print_fresh_key(data_path: str, embed_path: str) -> int:
    """Print `<ts> <refreshTs>` for the workflow freshness check. Unwraps in memory only."""
    data = load_plain_obj(data_path) if os.path.exists(data_path) else {}
    embed = {}
    if embed_path and os.path.exists(embed_path):
        embed = load_plain_obj(embed_path)
    ts = int((data or {}).get("ts") or 0)
    refresh = int((embed or {}).get("refreshTs") or (data or {}).get("refreshTs") or 0)
    print(ts, refresh)
    return 0


if __name__ == "__main__":
    cmd = (sys.argv[1] if len(sys.argv) > 1 else "") or "help"
    if cmd == "init":
        init_gate()
    elif cmd == "encrypt":
        if any_plain(PUBLISH):
            init_gate()
        n = 0
        for path in PUBLISH:
            if encrypt_data_file(path):
                n += 1
        print("encrypted_files", n, file=sys.stderr)
    elif cmd == "decrypt":
        if any_encrypted(PUBLISH):
            init_gate()
        n = 0
        for path in PUBLISH:
            if decrypt_data_file(path):
                n += 1
        print("unwrapped_files", n, file=sys.stderr)
    elif cmd == "verify":
        sys.exit(verify_from_env())
    elif cmd == "fresh-key":
        if len(sys.argv) < 4:
            print("usage: gate_crypto.py fresh-key data.json page_embed.json", file=sys.stderr)
            sys.exit(2)
        sys.exit(print_fresh_key(sys.argv[2], sys.argv[3]))
    else:
        print("usage: gate_crypto.py init|encrypt|decrypt|verify|fresh-key", file=sys.stderr)
        sys.exit(2)
