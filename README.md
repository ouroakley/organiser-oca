# OCA Organiser

This is the OCA organiser for the Our Oakley website.

Below still example content

## Directory Structure

```
example/
├── content/
│   ├── events/              # Event content organized by date
│   │   └── event-name       # A directory per event
│   ├── organisers-info/     # Detailed information about organisers
│   │   └── organiser-name       # A directory per organiser
│   └── venues-info/         # Detailed information about venues
│   │   └── venue-name       # A directory per venue
├── static/
│   └── admin/             # Decap CMS configuration
└── README.md
```

## Content Types

### Events
- Located in `content/events/`
- Can be organized in any way preferred by the organiser
- Can be associated with multiple venues and organisers
- Each event has:
  - Title
  - Description
  - Start/End dates
  - Venues (dash seperated version of title)
  - Organisers (dash seperated version of title)
  - Content body

### Venues Info
- Located in `content/venues-info/`
- One directory per venue
- Contains detailed information about venues
- Each venue info has:
  - Title
  - Content
  - Build settings (hidden in CMS)
- Venue info is shown from all allowed editors, with their name alongside

### Organisers Info
- Located in `content/organisers-info/`
- One directory per organiser
- Contains detailed information about organisers
- Each organiser info has:
  - Title
  - Content
  - Build settings (hidden in CMS)
- Organiser info is shown from all allowed editors, with their name alongside

## Setup Process

1. Create the directory structure:
   ```bash
   mkdir -p content/{events,organisers-info,venues-info}
   mkdir -p static/admin
   ```

2. Copy the Decap CMS configuration:
   ```bash
   cp config.yml static/admin/
   ```

3. Create initial content:
   - Create an example event in `content/events/`
   - Use at least one venue in event (dash seperated)
   - Use at least one organiser in event (dash seperated)
   - Create corresponding info pages in `venues-info/` and `organisers-info/`

4. Configure build settings:
   - The `venues-info` and `organisers-info` collections have build settings configured in the CMS
   - These settings ensure the info pages are not rendered but are available for listing
   - The settings are managed through the CMS and don't need manual configuration
   - This can be adjused in the Decap config or in GitHub directly if required.

## Usage

1. Events can be created in the CMS and will be automatically organized by date when published
2. When creating an event, you can:
   - Enter venues and organisers as needed
   - It is important to match existing venues and organiser to ensure they link correctly
   - Add new venues and organisers as needed
   - Add additional information in the relevant info collections as needed (if you are the organiser/venue)
3. Venues and organisers can be managed independently
4. Detailed information about venues and organisers is stored in the info collections
5. The info collections are not rendered as pages but are available for listing and reference

## Build Settings

The info collections (`venues-info` and `organisers-info`) have specific build settings:
- `render: "never"` - Pages are not rendered as HTML
- `list: "always"` - Pages are included in collections
- `publishResources: true` - Resources are published

These settings ensure that the info pages are available for reference but don't generate public pages. They are browsable on the venues and organisers pages if this group is confirmed as the editor for that content.
