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

Live verification on 23–24 November 2026: the deployed Google tag loaded after consent on Turkish and English pages. A real form submission explicitly labelled `TEST TT-GA4-20261123` showed the success screen and produced exactly one `generate_lead` key event in GA4 Realtime. Exclude that test from genuine lead reporting. Mailbox delivery has not been independently verified because the business Gmail account was not signed in.

## Form funnel (24 November 2026)

| Event | Meaning |
| --- | --- |
| `form_start` | First real option selection, form input or submit interaction, once per page visit. Automatic service prefills do not start the form. |
| `form_step_view` | A visible step, once per step per page visit. `form_step` is an integer from 1 to 5. Back navigation does not inflate views. |
| `form_step_complete` | A valid Continue/Submit action. Revisiting a step or retrying can repeat this event; use users or ordered funnel steps, not raw completion counts, for completion rates. |
| `form_submit_attempt` | A validated final send attempt. It is not a completed lead. |
| `form_error` | Validation or delivery error, with an allowlisted `error_type`. No field values or raw provider error text. |
| `generate_lead` | Delivery acknowledged successfully, once per page visit. This remains the only lead key event. |

The fixed `form_name` is `project_enquiry`. Steps: 1 customer type, 2 services, 3 budget/timing, 4 optional description, 5 contact details. Only the step number is sent; selected services, budget, timing and free text are not sent to GA4. Late consent reports the current step without replaying earlier views. No event or provider load occurs without consent.

GA4 event-scoped custom dimensions were registered for `form_step` (Form adımı), `error_type` (Form hata türü), and `form_name` (Form adı). Standard reports/explorations can take time to populate after registration.

For drop-off analysis, use ordered `form_step_view` steps filtered by `form_step=1,2,3,4,5`, followed by `generate_lead`, and enable an open funnel to include direct/prefilled entries. Monitor `form_start` separately as engagement with the form. A visit without a later step is an observed non-completion, not proof that a specific validation problem caused abandonment. Compare equal reported periods and exclude test visits. Do not emit unreliable page-unload events as definitive abandonment.

Sales follow-up uses the private/manual template under `operations/`; it is deliberately excluded from the static deployment. No customer list is exposed on the public site.
