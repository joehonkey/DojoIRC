# Slash Commands

Type any of these in the message input box. Tab completes both command names and nick arguments.

---

## Channel commands

| Command | Description |
|---|---|
| `/j #channel` | Join a channel (short alias for `/join`) |
| `/join #channel` | Join a channel |
| `/part [#channel]` | Leave a channel. Defaults to the current channel if omitted |
| `/topic <text>` | Set the channel topic (requires channel operator status) |
| `/invite <nick>` | Invite a user to the current channel |
| `/kick <nick> [reason]` | Kick a user from the channel (requires channel operator status) |
| `/mode <args>` | Set channel or user modes. Examples: `/mode +m`, `/mode +b nick!*@*` |

---

## Messaging

| Command | Description |
|---|---|
| `/me <text>` | Send a `/me` action message. Displayed as `* yournick text` |
| `/msg <nick> <text>` | Send a private message to a user and open a DM buffer |
| `/query <nick>` | Open a DM buffer for a user without sending a message |

---

## Nick and identity

| Command | Description |
|---|---|
| `/nick <name>` | Change your nickname |
| `/whois <nick>` | Look up info about a user — shown in the server buffer |
| `/away [message]` | Mark yourself as away with an optional message |
| `/back` | Clear your away status |

---

## Connection

| Command | Description |
|---|---|
| `/quit [message]` | Disconnect from the current server with an optional quit message |
| `/raw <line>` | Send a raw IRC protocol line. Useful for commands DojoIRC does not have a shortcut for |

---

## Buffer management

| Command | Description |
|---|---|
| `/clear` | Clear all messages from the current buffer |
| `/help` | Print the full command list into the current buffer |

---

## System

| Command | Description |
|---|---|
| `/sysinfo` | Post your OS, kernel, CPU, and RAM info to the current channel |

---

## Tab completion

Press **Tab** while typing to complete:

- **Nicks** — matches nicks present in the current channel. At the very start of the line, a `: ` suffix is added after the nick (standard IRC addressing convention). Press Tab again to cycle through all matches.
- **Commands** — type `/` then press Tab to complete or cycle through command names.

Any key other than Tab resets the completion cycle.

---

## Examples

```
/j #linux
/me waves
/msg alice hey, you around?
/nick coolnick
/whois alice
/topic Welcome to #dojoirc — DojoIRC development and testing
/kick spammer flooding the channel
/mode +m
/raw PRIVMSG #dojoirc :hello world
/away grabbing coffee
/back
/clear
/quit later everyone
```
