from portfolio_worker.url_tools import detect_platform, extract_handle, normalize_url


def test_normalize_url_adds_https_and_strips_www():
    assert normalize_url("www.github.com/Arnav8452/") == "https://github.com/Arnav8452"


def test_detect_platforms():
    assert detect_platform("https://github.com/Arnav8452") == "github"
    assert detect_platform("https://x.com/closr") == "x"
    assert detect_platform("https://example.com") == "website"


def test_extract_handle():
    assert extract_handle("https://youtube.com/@closr") == "closr"
    assert extract_handle("https://github.com/Arnav8452") == "Arnav8452"

