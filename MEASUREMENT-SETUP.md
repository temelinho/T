# Optional visit and enquiry measurement

GA4 is configured for Temel Technology as of 23 November 2026. Account: `417251609`; property: `565557477` (Temel Technology — Web); web stream: `16400737373`; public measurement ID: `G-MNFSVH5S57`. Reporting timezone: Türkiye; currency: TRY. Enhanced measurement is disabled to avoid automatic form and duplicate page events.

Connection and verification:

1. The public measurement ID is in `measurement-config.js`. No API key is needed.
2. In the GA4 web stream, turn off enhanced measurement (particularly automatic forms, outbound clicks, history page changes and site search). This site sends its own limited events; automatic events could duplicate them or capture extra URLs.
3. Review the site's measurement notice and any applicable account/privacy configuration before enabling collection. Publish the configuration through the normal build.
4. Choose **Allow measurement** in the footer's **Measurement preferences** panel on a test visit. Before consent, no Google tag is loaded. A declined choice is remembered, and the preference can be changed later.
5. Use GA4 DebugView/Realtime to verify `page_view`, `contact_click` and `generate_lead`. Mark `generate_lead` as a key event. Do not count contact clicks as completed leads.

`generate_lead` fires only after the existing mail delivery promise resolves successfully, once per successful form submission. Failures and validation errors do not trigger it. Measurement sends the canonical page URL, referring site origin, language and an allowlisted contact method; it does not include form values, telephone numbers, email addresses, project text, search terms or URL query parameters. Collection starts only after visitor consent. Withdrawing consent disables the Google tag and clears GA cookies.

The panel demo is a browser-only illustration with fictional records. Demo actions are not measured as sales enquiries. No demo data is sent to a server or retained after navigation/reload.

Search Console continues to provide search impressions/clicks independently. Its data cannot be treated as a count of submitted project enquiries.
