# FetchFox - Curation Collector
## Collects metadata of the current page and saves it to Local Browser Storage for content curation

### What is this project for?
I curate a lot of videos, podcasts, and articles online for things like my personal newsletter [david.garden/newsletter/](https://david.garden/newsletter/), vlogs [youtube.com/@BowieBarks](https://www.youtube.com/@BowieBarks), and Mastodon posts [@david@tech.lgbt](https://tech.lgbt/@david).

To do this curation I do a lot of copypasting between multiple apps and spaces. I have been wanting a tool to make it easier for me to manage my curation, and I'm finally making one!

The goal for this browser extension is to allow me to save the metadata of an article, video, or podcast for sharing to browser storage. I can then filter and sort those links and send them where I will end up using them in the format that I want most. The goal is to save articles and save time!

### How do I use it?
Right now I'm developing this browser extension for Firefox, and will try replicating it to other browsers when it is more stable.

#### To run this as a test extension:

**With auto-reload (recommended for development):**
- Clone the repo and run `npm install`
- Run `npm run dev` — opens Firefox with the extension loaded and reloads on file changes

**Manual load:**
- Download the files and unzip them
- Open a new tab in Firefox and go to `about:debugging#/runtime/this-firefox` in your address bar
- Click "Load Temporary Add-on..."
- Select the `manifest.json` file of the extension

#### To use the extension:
- Click "Save Metadata" to save the metadata of the current tab
- Click "View Saved Metadata" to see the existing saved pages in a table
- Drag and drop rows into the order that you want
- Click the "x" button next to a row to delete it
- Select a content type to organize your links
- Type in the Annotation field to add a note to any saved link
- Click "Clear All Data" to delete all rows
- Click "Export Data" to get export options
- Click "Export JSON" to get a JSON file of all saved metadata (includes annotations)
- Click "Export Markdown" to get a markdown file of select metadata (annotation included in default template)
- Click "Export HTML (WordPress)" to get WordPress block HTML — each link becomes a group block with an optional annotation paragraph
- Use the input and shortcodes under the export buttons to customize the Markdown/HTML export format

#### Metadata collected:
- title
- description
- url
- author
- language
- type
- provider
- keywords
- section
- published date
- modified date
- copyright
- image
- video
- audio
- link type (article / audio / video)
- annotation (manually added note)

### What if I want to make changes to it?
You are free to fork this for your personal use. It is under active development and will be made for very specific needs before being generalized for anyone to use.

If you think that you come up with something that you want to share back, I'm more than happy to check it out!

### Screenshots
#### FetchFox screenshot showing main popup with saved metadata
![FetchFox screenshot showing main popup with saved metadata](/images/fetchfox-screenshot-1.jpg?raw=true "FetchFox screenshot showing main popup with saved metadata")

#### FetchFox screenshot showing main popup with export options
![FetchFox screenshot showing main popup with export options](/images/fetchfox-screenshot-2.jpg?raw=true "FetchFox screenshot showing main popup with export options")

### Changelog
#### v0.4
- Adds annotation field — editable per-link note saved to storage
- Adds WordPress block HTML export (group blocks with optional annotation paragraph)
- Annotation included in default Markdown template and JSON export
- Adds npm dev workflow with web-ext for auto-reload development

#### v0.3
- Updates Apple Podcast metadata rules
- Updates PocketCasts metadata rules

#### v0.2
- Updates YouTube metadata rules
- Updates PocketCasts metadata rules

#### v0.1
- Intial commit
