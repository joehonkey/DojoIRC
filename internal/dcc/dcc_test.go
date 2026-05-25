package dcc

import (
	"os"
	"path/filepath"
	"testing"
)

func TestParseSend(t *testing.T) {
	tests := []struct {
		name     string
		param    string
		wantFile string
		wantIP   string
		wantPort int
		wantSize int64
		wantErr  bool
	}{
		{
			name: "basic unquoted",
			param: "file.txt 3232235777 5000 12345",
			wantFile: "file.txt", wantIP: "192.168.1.1", wantPort: 5000, wantSize: 12345,
		},
		{
			name: "quoted filename with space",
			param: `"my file.txt" 3232235777 5000 12345`,
			wantFile: "my file.txt", wantIP: "192.168.1.1", wantPort: 5000, wantSize: 12345,
		},
		{
			name: "quoted filename no space",
			param: `"file.txt" 3232235777 5000 12345`,
			wantFile: "file.txt", wantIP: "192.168.1.1", wantPort: 5000, wantSize: 12345,
		},
		{name: "too few fields", param: "file.txt", wantErr: true},
		{name: "missing size", param: "file.txt 3232235777 5000", wantErr: true},
		{name: "empty filename", param: `"" 3232235777 5000 12345`, wantErr: true},
		{name: "negative size", param: "file.txt 3232235777 5000 -1", wantErr: true},
		{name: "zero size", param: "file.txt 3232235777 5000 0", wantErr: true},
		{name: "port zero", param: "file.txt 3232235777 0 12345", wantErr: true},
		{name: "port negative", param: "file.txt 3232235777 -1 12345", wantErr: true},
		{name: "port too large", param: "file.txt 3232235777 65536 12345", wantErr: true},
		{name: "bad ip", param: "file.txt notanumber 5000 12345", wantErr: true},
		{name: "bad port", param: "file.txt 3232235777 notaport 12345", wantErr: true},
		{name: "bad size", param: "file.txt 3232235777 5000 notasize", wantErr: true},
		{name: "unterminated quote", param: `"file.txt 3232235777 5000 12345`, wantErr: true},
		{name: "path traversal stripped by caller", param: "../../evil.txt 3232235777 5000 12345",
			wantFile: "../../evil.txt", wantIP: "192.168.1.1", wantPort: 5000, wantSize: 12345},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			file, ip, port, size, err := ParseSend(tc.param)
			if tc.wantErr {
				if err == nil {
					t.Errorf("expected error, got file=%q ip=%q port=%d size=%d", file, ip, port, size)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if file != tc.wantFile {
				t.Errorf("file: got %q, want %q", file, tc.wantFile)
			}
			if ip != tc.wantIP {
				t.Errorf("ip: got %q, want %q", ip, tc.wantIP)
			}
			if port != tc.wantPort {
				t.Errorf("port: got %d, want %d", port, tc.wantPort)
			}
			if size != tc.wantSize {
				t.Errorf("size: got %d, want %d", size, tc.wantSize)
			}
		})
	}
}

func TestIPRoundTrip(t *testing.T) {
	cases := []struct {
		dotted string
		n      uint32
	}{
		{"192.168.1.1", 3232235777},
		{"10.0.0.1", 167772161},
		{"1.2.3.4", 16909060},
		{"0.0.0.0", 0},
		{"255.255.255.255", 4294967295},
	}
	for _, tc := range cases {
		got := IPFromUint32(tc.n)
		if got != tc.dotted {
			t.Errorf("IPFromUint32(%d) = %q, want %q", tc.n, got, tc.dotted)
		}
		n, err := IPToUint32(tc.dotted)
		if err != nil {
			t.Fatalf("IPToUint32(%q): %v", tc.dotted, err)
		}
		if n != tc.n {
			t.Errorf("IPToUint32(%q) = %d, want %d", tc.dotted, n, tc.n)
		}
	}
}

func TestIPToUint32_invalid(t *testing.T) {
	for _, s := range []string{"not-an-ip", "::1", "256.0.0.1", ""} {
		if _, err := IPToUint32(s); err == nil {
			t.Errorf("IPToUint32(%q): expected error", s)
		}
	}
}

func TestSafeDest_noConflict(t *testing.T) {
	dir := t.TempDir()
	got := safeDest(dir, "file.txt")
	want := filepath.Join(dir, "file.txt")
	if got != want {
		t.Errorf("got %q, want %q", got, want)
	}
}

func TestSafeDest_conflict(t *testing.T) {
	dir := t.TempDir()
	// Create the original file
	os.WriteFile(filepath.Join(dir, "file.txt"), []byte("x"), 0o600)
	got := safeDest(dir, "file.txt")
	want := filepath.Join(dir, "file (1).txt")
	if got != want {
		t.Errorf("got %q, want %q", got, want)
	}
}

func TestSafeDest_multipleConflicts(t *testing.T) {
	dir := t.TempDir()
	os.WriteFile(filepath.Join(dir, "file.txt"), []byte("x"), 0o600)
	os.WriteFile(filepath.Join(dir, "file (1).txt"), []byte("x"), 0o600)
	os.WriteFile(filepath.Join(dir, "file (2).txt"), []byte("x"), 0o600)
	got := safeDest(dir, "file.txt")
	want := filepath.Join(dir, "file (3).txt")
	if got != want {
		t.Errorf("got %q, want %q", got, want)
	}
}

func TestSafeDest_noExtension(t *testing.T) {
	dir := t.TempDir()
	os.WriteFile(filepath.Join(dir, "archive"), []byte("x"), 0o600)
	got := safeDest(dir, "archive")
	want := filepath.Join(dir, "archive (1)")
	if got != want {
		t.Errorf("got %q, want %q", got, want)
	}
}
