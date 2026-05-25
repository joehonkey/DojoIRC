package preview

import (
	"net"
	"strings"
	"testing"
)

func TestIsPrivateIP(t *testing.T) {
	tests := []struct {
		ip   string
		want bool
	}{
		{"127.0.0.1", true},
		{"127.0.0.255", true},
		{"10.0.0.1", true},
		{"10.255.255.255", true},
		{"172.16.0.1", true},
		{"172.31.255.255", true},
		{"192.168.0.1", true},
		{"192.168.255.255", true},
		{"::1", true},
		{"fc00::1", true},
		{"fdff::1", true},
		{"8.8.8.8", false},
		{"1.1.1.1", false},
		{"172.15.255.255", false},
		{"172.32.0.0", false},
		{"2001:4860:4860::8888", false},
	}
	for _, tc := range tests {
		ip := net.ParseIP(tc.ip)
		if ip == nil {
			t.Fatalf("bad test IP: %q", tc.ip)
		}
		got := isPrivateIP(ip)
		if got != tc.want {
			t.Errorf("isPrivateIP(%q) = %v, want %v", tc.ip, got, tc.want)
		}
	}
}

func TestIsPrivate(t *testing.T) {
	tests := []struct {
		host string
		want bool
	}{
		{"localhost", true},
		{"127.0.0.1", true},
		{"192.168.1.1", true},
		{"10.0.0.1", true},
		{"172.16.0.1", true},
		{"::1", true},
		{"8.8.8.8", false},
		{"example.com", false},
		{"", false},
	}
	for _, tc := range tests {
		got := isPrivate(tc.host)
		if got != tc.want {
			t.Errorf("isPrivate(%q) = %v, want %v", tc.host, got, tc.want)
		}
	}
}

func TestParseMeta_ogTags(t *testing.T) {
	body := `<html><head>
<title>Fallback Title</title>
<meta property="og:title" content="OG Title">
<meta property="og:description" content="OG description text">
<meta property="og:image" content="https://example.com/img.png">
</head></html>`
	r := &Result{URL: "https://example.com"}
	parseMeta(body, r)
	if r.Title != "OG Title" {
		t.Errorf("Title: got %q, want OG Title", r.Title)
	}
	if r.Description != "OG description text" {
		t.Errorf("Description: got %q", r.Description)
	}
	if r.Image != "https://example.com/img.png" {
		t.Errorf("Image: got %q", r.Image)
	}
}

func TestParseMeta_titleFallback(t *testing.T) {
	body := `<html><head><title>Page Title</title></head></html>`
	r := &Result{}
	parseMeta(body, r)
	if r.Title != "Page Title" {
		t.Errorf("Title: got %q, want Page Title", r.Title)
	}
}

func TestParseMeta_descriptionTruncation(t *testing.T) {
	long := strings.Repeat("a", 300)
	body := `<html><head><meta property="og:description" content="` + long + `"></head></html>`
	r := &Result{}
	parseMeta(body, r)
	if len(r.Description) > 200 {
		t.Errorf("description not truncated: len=%d", len(r.Description))
	}
	if !strings.HasSuffix(r.Description, "...") {
		t.Errorf("truncated description should end with '...': %q", r.Description[len(r.Description)-5:])
	}
}

func TestParseMeta_titleTruncation(t *testing.T) {
	long := strings.Repeat("b", 200)
	body := `<html><head><meta property="og:title" content="` + long + `"></head></html>`
	r := &Result{}
	parseMeta(body, r)
	if len(r.Title) > 120 {
		t.Errorf("title not truncated: len=%d", len(r.Title))
	}
	if !strings.HasSuffix(r.Title, "...") {
		t.Errorf("truncated title should end with '...': %q", r.Title[len(r.Title)-5:])
	}
}

func TestFetch_badScheme(t *testing.T) {
	for _, raw := range []string{
		"ftp://example.com/file",
		"javascript:alert(1)",
		"file:///etc/passwd",
		"data:text/html,<h1>hi</h1>",
		"",
	} {
		r := Fetch(raw)
		if r.Title != "" || r.Description != "" || r.Image != "" {
			t.Errorf("Fetch(%q) should return empty metadata, got title=%q", raw, r.Title)
		}
	}
}

func TestFetch_privateHost(t *testing.T) {
	for _, raw := range []string{
		"http://localhost/test",
		"http://127.0.0.1/test",
		"http://192.168.1.1/test",
		"http://10.0.0.1/test",
		"https://172.16.0.1/test",
	} {
		r := Fetch(raw)
		if r.Title != "" || r.Description != "" {
			t.Errorf("Fetch(%q) returned metadata for private host: title=%q", raw, r.Title)
		}
	}
}

func TestFetch_imageExtension(t *testing.T) {
	for _, raw := range []string{
		"https://example.com/photo.jpg",
		"https://example.com/image.png",
		"https://example.com/anim.gif",
		"https://example.com/pic.webp",
	} {
		r := Fetch(raw)
		if !r.IsImage {
			t.Errorf("Fetch(%q): expected IsImage=true", raw)
		}
		if r.Image != raw {
			t.Errorf("Fetch(%q): Image=%q, want %q", raw, r.Image, raw)
		}
	}
}
