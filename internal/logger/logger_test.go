package logger

import "testing"

func TestIsSecret(t *testing.T) {
	secret := []string{
		"IDENTIFY mypassword",
		"identify mypassword",
		"AUTHENTICATE base64payload==",
		"GHOST oldnick password",
		"RELEASE oldnick password",
		"  IDENTIFY password",
	}
	for _, s := range secret {
		if !isSecret(s) {
			t.Errorf("isSecret(%q) = false, want true", s)
		}
	}

	safe := []string{
		"hello world",
		"identified to services",
		"You are now identified",
		"PRIVMSG #channel :hi",
		"",
	}
	for _, s := range safe {
		if isSecret(s) {
			t.Errorf("isSecret(%q) = true, want false", s)
		}
	}
}
