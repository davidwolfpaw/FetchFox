document.addEventListener('DOMContentLoaded', function () {
    const saveButton = document.getElementById('save-metadata');
    const viewButton = document.getElementById('view-metadata');
    const metadataTable = document.getElementById('metadata-table');
    const metadataBody = document.getElementById('metadata-body');
    const clearButton = document.getElementById('clear-metadata');
    const exportDropdownButton = document.getElementById('export-dropdown');
    const exportJsonButton = document.getElementById('export-json');
    const exportMarkdownButton = document.getElementById('export-markdown');
    const exportOptions = document.getElementById('export-options');
    const exportTemplate = document.getElementById('export-template');
    const templateTextArea = document.getElementById('template');

    // Set a default template for Markdown export
    const defaultTemplate = "[[title] - [author], [provider]]([url])";

    // Event listener for saving metadata
    saveButton.addEventListener('click', saveMetadata);
    // Event listener for viewing metadata
    viewButton.addEventListener('click', buildTable);
    // Event listener for clearing all metadata
    clearButton.addEventListener('click', clearAllMetadata);
    // Event listener for showing export options
    exportDropdownButton.addEventListener('click', () => {
        exportOptions.style.display = exportOptions.style.display === 'none' ? 'block' : 'none';
        exportTemplate.style.display = exportTemplate.style.display === 'none' ? 'flex' : 'none';
    });
    // Event listener for exporting metadata as JSON
    exportJsonButton.addEventListener('click', exportJson);
    // Event listener for exporting metadata as Markdown
    exportMarkdownButton.addEventListener('click', exportMarkdown);

    // Function to handle saving metadata
    function saveMetadata() {
        browser.runtime.sendMessage({ action: "saveMetadata" }).then(response => {
            showMessage(response.message, response.success ? "success" : "error");
        }).catch(error => {
            showMessage("Error: " + error, "error");
        });
    }

    // Function to display a temporary message
    function showMessage(msg, type) {
        const messageElement = document.getElementById('message');
        messageElement.textContent = msg;
        messageElement.className = type;
        messageElement.classList.add('show');

        // Remove the message after a delay
        setTimeout(() => {
            messageElement.classList.remove('show');
            messageElement.classList.add('hide');
        }, 1500);

        // Clear the message content after it fades out
        setTimeout(() => {
            messageElement.textContent = '';
            messageElement.classList.remove('hide');
        }, 2000);
    }

    // Function to clear all metadata
    function clearAllMetadata() {
        if (confirm('Are you sure that you want to clear all saved metadata?')) {
            browser.storage.local.set({ 'allMetadata': [] }).then(() => {
                showMessage('All metadata cleared', 'success');
                buildTable();
            }).catch(error => {
                showMessage('Error clearing metadata: ' + error, 'error');
            });
        }
    }

    // Function to export metadata as JSON
    function exportJson() {
        browser.storage.local.get('allMetadata').then(data => {
            downloadObjectAsJson(data.allMetadata || [], 'exported_metadata');
        }).catch(error => {
            showMessage('Error exporting metadata: ' + error, 'error');
        });
    }

    // Function to download JSON data as a file
    function downloadObjectAsJson(exportObj, exportName) {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", exportName + ".json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }

    // Function to export metadata as Markdown
    function exportMarkdown() {
        const template = templateTextArea.value.trim() || defaultTemplate;
        browser.storage.local.get('allMetadata').then(data => {
            const metadata = data.allMetadata || [];
            let markdownContent = '';

            metadata.forEach(meta => {
                let line = template;
                for (const key in meta) {
                    if (meta.hasOwnProperty(key)) {
                        const regex = new RegExp(`\\[${key}\\]`, 'g');
                        line = line.replace(regex, meta[key] || '');
                    }
                }
                markdownContent += line + '\n';
            });

            downloadTextAsFile(markdownContent, 'exported_metadata', 'md');
        }).catch(error => {
            showMessage('Error exporting metadata: ' + error, 'error');
        });
    }

    // Function to download text data as a file
    function downloadTextAsFile(text, exportName, fileExtension) {
        const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(text);
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `${exportName}.${fileExtension}`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }

    // Function to build the metadata table
    function buildTable() {
        browser.storage.local.get('allMetadata').then(data => {
            const metadata = data.allMetadata || [];
            // Clear existing table rows
            metadataBody.innerHTML = '';

            // Populate table with metadata
            metadata.forEach((meta, index) => {
                const row = document.createElement('tr');

                // Create and append delete button cell
                const deleteCell = document.createElement('td');
                const deleteButton = document.createElement('button');
                deleteButton.textContent = '\u{2716}';
                deleteButton.addEventListener('click', () => deleteMetadata(index));
                deleteCell.appendChild(deleteButton);
                row.appendChild(deleteCell);

                // Create and append title cell
                const titleCell = document.createElement('td');
                titleCell.textContent = meta.title || 'No title';
                row.appendChild(titleCell);

                // Create and append URL cell
                const urlCell = document.createElement('td');
                urlCell.textContent = meta.url || 'No URL';
                row.appendChild(urlCell);

                // Create and append author cell
                const authorCell = document.createElement('td');
                authorCell.textContent = meta.author || 'No author';
                row.appendChild(authorCell);

                // Create and append publish date cell
                const publishDateCell = document.createElement('td');
                publishDateCell.textContent = formatDate(meta.published) || 'No publish date';
                row.appendChild(publishDateCell);

                // Create and append link type cell with dropdown
                const linkTypeCell = document.createElement('td');
                const linkTypeDropdown = document.createElement('select');
                linkTypeDropdown.classList.add('link-type-dropdown');
                linkTypeDropdown.dataset.index = index;

                const articleOption = document.createElement('option');
                articleOption.value = 'article';
                articleOption.selected = meta.linkType === 'article';
                articleOption.textContent = 'Article';
                linkTypeDropdown.appendChild(articleOption);

                const audioOption = document.createElement('option');
                audioOption.value = 'audio';
                audioOption.selected = meta.linkType === 'audio';
                audioOption.textContent = 'Audio';
                linkTypeDropdown.appendChild(audioOption);

                const videoOption = document.createElement('option');
                videoOption.value = 'video';
                videoOption.selected = meta.linkType === 'video';
                videoOption.textContent = 'Video';
                linkTypeDropdown.appendChild(videoOption);

                linkTypeDropdown.addEventListener('change', (event) => updateLinkType(event, index));
                linkTypeCell.appendChild(linkTypeDropdown);
                row.appendChild(linkTypeCell);

                // Set attributes for drag and drop
                row.setAttribute('draggable', true);
                row.setAttribute('class', 'draggable');
                row.setAttribute('data-index', index);

                // Add drag and drop event listeners
                row.addEventListener('dragstart', handleDragStart);
                row.addEventListener('dragenter', handleDragEnter);
                row.addEventListener('dragover', handleDragOver);
                row.addEventListener('dragleave', handleDragLeave);
                row.addEventListener('drop', handleDrop);
                row.addEventListener('dragend', handleDragEnd);

                // Append row to table body
                metadataBody.appendChild(row);
            });

            // Show the table
            metadataTable.style.display = 'table';
            // Toggle visibility of the Clear All Data button
            clearButton.style.display = metadata.length ? 'block' : 'none';
        }).catch(error => {
            alert('Error retrieving metadata: ' + error);
        });
    }


    // Function to delete a specific metadata entry
    function deleteMetadata(index) {
        browser.storage.local.get('allMetadata').then(data => {
            let metadata = data.allMetadata || [];
            metadata.splice(index, 1);
            browser.storage.local.set({ 'allMetadata': metadata }).then(buildTable);
        }).catch(error => {
            alert('Error deleting metadata: ' + error);
        });
    }

    // Function to update the link type
    function updateLinkType(event, index) {
        const newLinkType = event.target.value;
        browser.storage.local.get('allMetadata').then(data => {
            let metadata = data.allMetadata || [];
            if (metadata[index]) {
                metadata[index].linkType = newLinkType;
                browser.storage.local.set({ 'allMetadata': metadata }).then(buildTable);
            }
        }).catch(error => {
            alert('Error updating link type: ' + error);
        });
    }

    // Drag and drop event handlers
    function handleDragStart(e) {
        this.classList.add('dragging');
        dragSrcEl = this;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);
    }

    function handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault(); // Allow drop
        }
        e.dataTransfer.dropEffect = 'move';
        return false;
    }

    function handleDragEnter() {
        this.classList.add('over');
    }

    function handleDragLeave() {
        this.classList.remove('over');
    }

    function handleDrop(e) {
        if (e.stopPropagation) {
            e.stopPropagation(); // Stop redirect
        }
        if (dragSrcEl !== this) {
            let fromIndex = dragSrcEl.getAttribute('data-index');
            let toIndex = this.getAttribute('data-index');
            updateStorageOrder(parseInt(fromIndex, 10), parseInt(toIndex, 10));
        }
        return false;
    }

    function handleDragEnd() {
        document.querySelectorAll('.draggable').forEach(row => {
            row.classList.remove('over', 'dragging');
        });
    }

    // Function to update metadata order in storage
    function updateStorageOrder(fromIndex, toIndex) {
        browser.storage.local.get('allMetadata').then(data => {
            let metadata = data.allMetadata || [];
            metadata.splice(toIndex, 0, metadata.splice(fromIndex, 1)[0]);
            browser.storage.local.set({ 'allMetadata': metadata }).then(buildTable);
        });
    }

    // Function to format timestamps into a human-readable date
    function formatDate(timestamp) {
        const date = new Date(timestamp);
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }
});
