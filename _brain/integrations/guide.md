# INTEGRATIONS GUIDE
> Migration guide for adding Slack and Microsoft Teams notifications when ready.
> Current status: Webhooks + REST API are built. This guide is for when you want native chat platform integration.

---

## CURRENT INTEGRATION LAYER (Built)

The system currently supports:
- **REST API** (`/api/v1/`) — full CRUD access for any external system
- **Webhooks** — HTTP POST fired on ticket events to any URL you configure

These two primitives can already integrate with Slack and Teams via their incoming webhook URLs — no code changes needed. See "Quick Integration (No Code)" below.

---

## QUICK INTEGRATION — NO CODE REQUIRED

### Slack (via Incoming Webhooks)
1. In Slack: go to **Apps → Incoming Webhooks → Add to Slack**
2. Choose a channel and copy the Webhook URL
3. In the ticketing system: **Settings → Webhooks → Add Webhook**
4. Paste the Slack Webhook URL
5. Select events: `ticket.created`, `ticket.assigned`, `ticket.resolved`
6. Slack will receive a JSON payload — Slack auto-formats it

**Limitation:** The message format will be raw JSON. To get nicely formatted Slack messages (with Block Kit), you need the full integration below.

### Microsoft Teams (via Incoming Webhooks)
1. In Teams: Channel → **Connectors → Incoming Webhook → Configure**
2. Copy the Webhook URL
3. In the ticketing system: **Settings → Webhooks → Add Webhook**
4. Paste the Teams Webhook URL
5. Select events to fire
6. Teams will receive the payload as a message card

**Limitation:** Same as Slack — raw JSON, not a rich card.

---

## FULL NATIVE INTEGRATION — SLACK

### When to implement
- When you want rich Slack notifications with buttons (e.g. "View Ticket", "Assign to Me")
- When agents need to reply to tickets from Slack
- When you want bi-directional sync

### What needs to be built

#### 1. Create a Slack App
- Go to api.slack.com/apps → Create New App → From Scratch
- Enable: **Incoming Webhooks**, **Bot Token Scopes** (chat:write, channels:read, users:read)
- Install to your workspace
- Save: `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET` to `.env`

#### 2. New Laravel Package to Install
```bash
composer require slack/slack-php-block-kit
```

#### 3. New .env Variables
```env
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_DEFAULT_CHANNEL=#support
```

#### 4. New Files to Create
```
app/Services/SlackService.php          # Send formatted Block Kit messages
app/Http/Controllers/SlackController.php  # Handle Slack slash commands + interactivity
routes/api.php                          # Add /slack/events and /slack/interact endpoints
app/Jobs/SendSlackNotification.php      # Queued Slack message dispatch
```

#### 5. SlackService — Key Methods
```php
public function sendTicketCreated(Ticket $ticket): void
public function sendTicketAssigned(Ticket $ticket, User $agent): void
public function sendSLABreach(Ticket $ticket): void
public function sendTicketResolved(Ticket $ticket): void
```

#### 6. Block Kit Message Format (example)
```json
{
  "blocks": [
    {
      "type": "header",
      "text": { "type": "plain_text", "text": "🎫 New Ticket #1234" }
    },
    {
      "type": "section",
      "fields": [
        { "type": "mrkdwn", "text": "*Subject:*\nLogin issue" },
        { "type": "mrkdwn", "text": "*Priority:*\n🔴 Critical" },
        { "type": "mrkdwn", "text": "*Client:*\nJohn Doe" }
      ]
    },
    {
      "type": "actions",
      "elements": [
        { "type": "button", "text": { "type": "plain_text", "text": "View Ticket" }, "url": "https://tickets.yourdomain.com/tickets/1234" },
        { "type": "button", "text": { "type": "plain_text", "text": "Assign to Me" }, "action_id": "assign_to_me", "value": "1234" }
      ]
    }
  ]
}
```

#### 7. Wire into existing event system
In `TicketCreated` listener, add:
```php
SendSlackNotification::dispatch($ticket, 'created')->onQueue('notifications');
```

#### 8. Security — Verify Slack Requests
All requests from Slack must be verified using `SLACK_SIGNING_SECRET`:
```php
$timestamp = $request->header('X-Slack-Request-Timestamp');
$signature = $request->header('X-Slack-Signature');
// Verify HMAC-SHA256 signature
```

---

## FULL NATIVE INTEGRATION — MICROSOFT TEAMS

### When to implement
- When your company uses Microsoft Teams as primary communication
- When you want adaptive card notifications with action buttons
- When you want bi-directional ticket management from Teams

### What needs to be built

#### 1. Register an Azure App
- Azure Portal → App Registrations → New Registration
- Enable: Microsoft Graph API permissions (ChannelMessage.Send, User.Read)
- Save: `TEAMS_TENANT_ID`, `TEAMS_CLIENT_ID`, `TEAMS_CLIENT_SECRET` to `.env`

#### 2. New .env Variables
```env
TEAMS_TENANT_ID=your-tenant-id
TEAMS_CLIENT_ID=your-client-id
TEAMS_CLIENT_SECRET=your-client-secret
TEAMS_CHANNEL_ID=your-channel-id
TEAMS_TEAM_ID=your-team-id
```

#### 3. New Package to Install
```bash
composer require microsoft/microsoft-graph
```

#### 4. New Files to Create
```
app/Services/TeamsService.php              # Send Adaptive Cards via Graph API
app/Http/Controllers/TeamsController.php  # Handle Teams bot callbacks
app/Jobs/SendTeamsNotification.php         # Queued Teams message dispatch
```

#### 5. Adaptive Card Format (example)
```json
{
  "type": "AdaptiveCard",
  "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
  "version": "1.4",
  "body": [
    { "type": "TextBlock", "text": "New Ticket #1234", "weight": "Bolder", "size": "Medium" },
    { "type": "FactSet", "facts": [
      { "title": "Subject", "value": "Login issue" },
      { "title": "Priority", "value": "Critical" },
      { "title": "Client", "value": "John Doe" }
    ]}
  ],
  "actions": [
    { "type": "Action.OpenUrl", "title": "View Ticket", "url": "https://tickets.yourdomain.com/tickets/1234" }
  ]
}
```

---

## MIGRATION CHECKLIST (when ready to implement)

### Slack
- [ ] Create Slack App in api.slack.com
- [ ] Add `SLACK_BOT_TOKEN` and `SLACK_SIGNING_SECRET` to `.env`
- [ ] Install `slack/slack-php-block-kit`
- [ ] Create `SlackService.php`
- [ ] Create `SendSlackNotification.php` job
- [ ] Create `SlackController.php` for interactivity endpoints
- [ ] Add routes in `api.php`
- [ ] Wire into existing event listeners
- [ ] Add Slack channel configuration to Admin Settings UI
- [ ] Test with real Slack workspace

### Microsoft Teams
- [ ] Register Azure App in Azure Portal
- [ ] Add Teams env vars to `.env`
- [ ] Install `microsoft/microsoft-graph`
- [ ] Create `TeamsService.php`
- [ ] Create `SendTeamsNotification.php` job
- [ ] Wire into existing event listeners
- [ ] Add Teams configuration to Admin Settings UI
- [ ] Test with real Teams tenant

---

## ESTIMATED IMPLEMENTATION TIME

| Integration | Estimated Time |
|---|---|
| Slack (basic notifications only) | 1–2 days |
| Slack (with action buttons + reply from Slack) | 3–4 days |
| Microsoft Teams (notifications only) | 1–2 days |
| Microsoft Teams (with action buttons) | 2–3 days |
