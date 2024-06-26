# FetchFox - Curation Collector
## Collects metadata of the current page and saves it to Local Browser Storage for content curation

### What is this project for?
I curate a lot of videos, podcasts, and articles online for things like my personal newsletter [david.garden/newsletter/](https://david.garden/newsletter/), vlogs [youtube.com/@BowieBarks](https://www.youtube.com/@BowieBarks), and Mastodon posts [@david@tech.lgbt](https://tech.lgbt/@david).

To do this curation I do a lot of copypasting between multiple apps and spaces. I have been wanting a tool to make it easier for me to manage my curation, and I'm finally making one!

The goal for this browser extension is to allow me to save the metadata of an article, video, or podcast for sharing to browser storage. I can then filter and sort those links and send them where I will end up using them in the format that I want most. The goal is to save articles and save time!

### How do I use it?
Right now I'm developing this browser extension for Firefox, and will try replicating it to other browsers when it is more stable.

#### To run this as a test extension:
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
- Click "Clear All Data" to delete all rows
- Click "Export Data" to get export options (currently JSON or Markdown)
- Click "Export JSON" to get a JSON file of all saved metadata
- Click "Export Markdown" to get a markdown file of select metadata
- Use the input and shortcodes under the export buttons to design the format of the Markdown that is exported

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
- link sorting type

### What if I want to make changes to it?
You are free to fork this for your personal use. It is under active development and will be made for very specific needs before being generalized for anyone to use.

If you think that you come up with something that you want to share back, I'm more than happy to check it out!

### Screenshots
#### FetchFox screenshot showing main popup with saved metadata
![FetchFox screenshot showing main popup with saved metadata](/images/fetchfox-screenshot-1.jpg?raw=true "FetchFox screenshot showing main popup with saved metadata")

#### FetchFox screenshot showing main popup with export options
![FetchFox screenshot showing main popup with export options](/images/fetchfox-screenshot-2.jpg?raw=true "FetchFox screenshot showing main popup with export options")
