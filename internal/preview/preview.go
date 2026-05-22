package preview

import (
	"io"
	"net"
	"net/http"
	"net/url"
	"strings"
	"time"

	"golang.org/x/net/html"
)

// Result holds the metadata we care about for a URL preview.
type Result struct {
	URL         string `json:"url"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Image       string `json:"image"`
	Domain      string `json:"domain"`
	IsImage     bool   `json:"isImage"`
}

var imageExts = map[string]bool{
	".jpg": true, ".jpeg": true, ".png": true,
	".gif": true, ".webp": true, ".svg": true,
}

var client = &http.Client{
	Timeout: 5 * time.Second,
	CheckRedirect: func(req *http.Request, via []*http.Request) error {
		if len(via) >= 3 {
			return http.ErrUseLastResponse
		}
		return nil
	},
}

// Fetch returns a preview Result for the given URL.
// Returns an empty Result (with URL set) on failure rather than an error.
func Fetch(rawURL string) Result {
	r := Result{URL: rawURL}

	u, err := url.Parse(rawURL)
	if err != nil || (u.Scheme != "http" && u.Scheme != "https") {
		return r
	}

	host := u.Hostname()
	r.Domain = host

	if isPrivate(host) {
		return r
	}

	// Direct image link — no need to fetch HTML
	lower := strings.ToLower(u.Path)
	for ext := range imageExts {
		if strings.HasSuffix(lower, ext) {
			r.IsImage = true
			r.Image = rawURL
			return r
		}
	}

	req, err := http.NewRequest("GET", rawURL, nil)
	if err != nil {
		return r
	}
	req.Header.Set("User-Agent", "DojoIRC/1.0 (+https://github.com/joehonkey/dojoire)")
	req.Header.Set("Accept", "text/html,application/xhtml+xml")

	resp, err := client.Do(req)
	if err != nil {
		return r
	}
	defer resp.Body.Close()

	ct := resp.Header.Get("Content-Type")
	if !strings.Contains(ct, "text/html") && !strings.Contains(ct, "xhtml") {
		return r
	}

	// Read at most 128KB — the <head> is always near the top
	body, err := io.ReadAll(io.LimitReader(resp.Body, 128*1024))
	if err != nil {
		return r
	}

	parseMeta(string(body), &r)
	return r
}

func parseMeta(body string, r *Result) {
	z := html.NewTokenizer(strings.NewReader(body))
	for {
		tt := z.Next()
		if tt == html.ErrorToken {
			break
		}
		tok := z.Token()

		// Stop once we leave <head>
		if tt == html.EndTagToken && tok.Data == "head" {
			break
		}

		if tt == html.StartTagToken && tok.Data == "title" {
			if z.Next() == html.TextToken {
				if r.Title == "" {
					r.Title = strings.TrimSpace(string(z.Raw()))
				}
			}
			continue
		}

		if tt != html.SelfClosingTagToken && tt != html.StartTagToken {
			continue
		}
		if tok.Data != "meta" {
			continue
		}

		prop, name, content := "", "", ""
		for _, a := range tok.Attr {
			switch strings.ToLower(a.Key) {
			case "property":
				prop = strings.ToLower(a.Val)
			case "name":
				name = strings.ToLower(a.Val)
			case "content":
				content = a.Val
			}
		}

		key := prop
		if key == "" {
			key = name
		}

		switch key {
		case "og:title", "twitter:title":
			if r.Title == "" || prop != "" {
				r.Title = content
			}
		case "og:description", "twitter:description", "description":
			if r.Description == "" || prop != "" {
				r.Description = content
			}
		case "og:image", "twitter:image":
			if r.Image == "" || prop != "" {
				r.Image = content
			}
		}
	}

	// Truncate long descriptions
	if len(r.Description) > 200 {
		r.Description = r.Description[:197] + "..."
	}
	if len(r.Title) > 120 {
		r.Title = r.Title[:117] + "..."
	}
}

func isPrivate(host string) bool {
	if host == "localhost" {
		return true
	}
	ip := net.ParseIP(host)
	if ip == nil {
		return false
	}
	private := []string{
		"10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16",
		"127.0.0.0/8", "::1/128", "fc00::/7",
	}
	for _, cidr := range private {
		_, block, _ := net.ParseCIDR(cidr)
		if block != nil && block.Contains(ip) {
			return true
		}
	}
	return false
}
