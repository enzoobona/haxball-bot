import pytest

from bracket.logic.haxball_identity import (
    LINK_CODE_ALPHABET,
    LINK_CODE_LENGTH,
    clean_link_code,
    format_link_code,
    generate_link_code,
    hash_link_code,
    is_well_formed_link_code,
    mask_auth,
    normalize_player_name,
    validate_nickname,
)


def test_normalize_player_name_matches_the_bot() -> None:
    # Misma regla que `normalizeName` de bot/lib/authStore.js
    assert normalize_player_name("  Ángel  ") == "angel"
    assert normalize_player_name("MESSI") == normalize_player_name("messi")
    assert normalize_player_name("Ñandú") == "nandu"


def test_generate_link_code_uses_only_readable_characters() -> None:
    for _ in range(200):
        code = generate_link_code()
        assert len(code) == LINK_CODE_LENGTH
        assert set(code) <= set(LINK_CODE_ALPHABET)
        assert is_well_formed_link_code(code)

    assert not set("01ILO") & set(LINK_CODE_ALPHABET)


def test_link_code_accepts_dash_spaces_and_lowercase() -> None:
    code = "ABCD2345"
    assert format_link_code(code) == "ABCD-2345"
    assert clean_link_code("abcd-2345") == code
    assert clean_link_code(" abcd 2345 ") == code
    assert hash_link_code("abcd-2345") == hash_link_code(code)
    assert hash_link_code(code) != hash_link_code("ABCD2346")


@pytest.mark.parametrize("raw", ["", "ABC", "ABCD-23450", "ABCD-234!", "ABCD-IIII"])
def test_malformed_link_codes_are_rejected(raw: str) -> None:
    assert not is_well_formed_link_code(raw)


@pytest.mark.parametrize("name", ["!admin", "#12", '"Messi"', "a", "x" * 31, "tab\tname"])
def test_invalid_nicknames(name: str) -> None:
    with pytest.raises(ValueError):
        validate_nickname(name)


def test_valid_nickname_is_trimmed() -> None:
    assert validate_nickname("  Leo Messi  ") == "Leo Messi"


def test_mask_auth_never_shows_the_whole_key() -> None:
    auth = "abcdefghijklmnopqrstuvwxyz"
    masked = mask_auth(auth)
    assert masked == "abcd…wxyz"
    assert auth not in masked
    assert mask_auth("short") == "…"
