document.addEventListener('DOMContentLoaded', function () {
    const saveButton = document.getElementById('save-metadata');
    const viewButton = document.getElementById('view-metadata');
    const metadataTable = document.getElementById('metadata-table');
    const metadataBody = document.getElementById('metadata-body');
    const clearButton = document.getElementById('clear-metadata');
    const exportButton = document.getElementById('export-metadata');

    // Handle saving of the metadata on click of save button
    saveButton.addEventListener('click', function () {
        browser.runtime.sendMessage({ action: "saveMetadata" }).then(response => {
            if (response.success) {
                showMessage(response.message, "success");
            } else {
                showMessage(response.message, "error");
            }
        }).catch(error => {
            showMessage("Error: " + error, "error");
        });
    });

    // Create a temporary message to display in the popup
    function showMessage(msg, type) {
        const messageElement = document.getElementById('message');
        messageElement.textContent = msg;
        messageElement.className = type;
        messageElement.classList.add('show');

        setTimeout(() => {
            messageElement.classList.remove('show');
            messageElement.classList.add('hide');
        }, 1500);

        setTimeout(() => {
            // Clear the message
            messageElement.textContent = '';
            messageElement.classList.remove('hide');
        }, 2000);
    }

    // Handle viewing of the metadata on click of view button
    viewButton.addEventListener('click', function () {
        // Generate table content
        buildTable();
        // Display table
        metadataTable.style.display = 'table';
        // Show the Clear All Data button
        clearButton.style.display = 'block';
    });

    // Handle deletion of all metadata on click of delete button
    clearButton.addEventListener('click', function () {
        if (confirm('Are you sure that you want to clear all saved metadata?')) {
            browser.storage.local.set({ 'allMetadata': [] }).then(() => {
                showMessage('All metadata cleared', 'success');
                // Rebuild or refresh the table
                buildTable();
            }).catch(error => {
                showMessage('Error clearing metadata: ' + error, 'error');
            });
        }
    });

    function deleteMetadata(index) {
        // Retrieve the current metadata array from storage
        browser.storage.local.get('allMetadata').then(data => {
            let metadata = data.allMetadata || [];

            // Remove the item at the specified index
            metadata.splice(index, 1);

            // Save the updated array back to storage
            browser.storage.local.set({ 'allMetadata': metadata }).then(() => {
                // Update the displayed table
                buildTable();
            });
        }).catch(error => {
            alert('Error deleting metadata: ' + error);
        });
    }

    // Handle export of metadata on click of export button
    exportButton.addEventListener('click', function () {
        browser.storage.local.get('allMetadata').then(data => {
            const metadata = data.allMetadata || [];
            downloadObjectAsJson(metadata, 'exported_metadata');
        }).catch(error => {
            showMessage('Error exporting metadata: ' + error, 'error');
        });
    });

    function downloadObjectAsJson(exportObj, exportName) {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", exportName + ".json");
        document.body.appendChild(downloadAnchorNode); // Required for Firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }

    function buildTable() {
        // Retrieve saved metadata from browser.storage.local
        browser.storage.local.get('allMetadata').then(data => {
            const metadata = data.allMetadata || [];

            // Clear existing table rows
            metadataBody.innerHTML = '';

            metadata.forEach((meta, index) => {
                const row = metadataBody.insertRow();

                // Add delete button cell
                const deleteCell = row.insertCell();
                const deleteButton = document.createElement('button');
                deleteButton.textContent = '\u{2716}';
                deleteButton.addEventListener('click', () => deleteMetadata(index));
                deleteCell.appendChild(deleteButton);

                // Insert metadata into table
                row.insertCell().textContent = meta.title || 'No title';
                row.insertCell().textContent = meta.url || 'No URL';
                row.insertCell().textContent = meta.author || 'No author';
                row.insertCell().textContent = formatDate(meta.published) || 'No publish date';

                // Set drag and drop attributes
                row.setAttribute('draggable', true);
                row.setAttribute('class', 'draggable');
                row.setAttribute('data-index', index);

                // Add drag and drop event listeners
                row.addEventListener('dragstart', handleDragStart, false);
                row.addEventListener('dragenter', handleDragEnter, false);
                row.addEventListener('dragover', handleDragOver, false);
                row.addEventListener('dragleave', handleDragLeave, false);
                row.addEventListener('drop', handleDrop, false);
                row.addEventListener('dragend', handleDragEnd, false);

                metadataBody.appendChild(row);
            });

            // Show the table
            metadataTable.style.display = 'table';
            // If there is no metadata, hide the Clear All Data button
            clearButton.style.display = metadata.length === 0 ? 'none' : 'block';
        }).catch(error => {
            alert('Error retrieving metadata: ' + error);
        });
    }

    // Update the viewButton event listener to use buildTable
    viewButton.addEventListener('click', buildTable);

    // This will store the node that we are dragging.
    let dragSrcEl = null;

    function handleDragStart(e) {
        this.classList.add('dragging');
        dragSrcEl = this;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);

        // Add the over class to all rows except the one being dragged
        let rows = Array.from(document.querySelectorAll('.draggable'));
        rows.forEach(row => {
            if (row !== dragSrcEl) {
                row.classList.add('over');
            }
        });
    }

    function handleDragOver(e) {
        if (e.preventDefault) {
            // Allows us to drop.
            e.preventDefault();
        }

        e.dataTransfer.dropEffect = 'move';
        return false;
    }

    function handleDragEnter(e) {
        this.classList.add('over');
    }

    function handleDragLeave(e) {
        this.classList.remove('over');
    }

    function handleDrop(e) {
        if (e.stopPropagation) {
            e.stopPropagation(); // Stops the browser from redirecting.
        }

        // Perform the action only if the dragged element is different from the target
        if (dragSrcEl !== this) {
            // Perform the data swap here
            let rows = Array.from(document.querySelectorAll('.draggable'));
            let fromIndex = dragSrcEl.getAttribute('data-index');
            let toIndex = this.getAttribute('data-index');
            rows[fromIndex].outerHTML = this.outerHTML;
            rows[toIndex].outerHTML = dragSrcEl.outerHTML;

            // Update the storage with the new order
            updateStorageOrder(parseInt(fromIndex, 10), parseInt(toIndex, 10));
        }

        if (dragSrcEl != this) {
            // Swap the HTML of the dragged row and the row over which it's dropped
            dragSrcEl.innerHTML = this.innerHTML;
            this.innerHTML = e.dataTransfer.getData('text/html');

            // Update the indexes and the storage to reflect the new order
            updateIndexesAndStorage();
        }

        return false;
    }

    function handleDragEnd(e) {
        // Remove the styles from the drag source and all other rows
        let rows = Array.from(document.querySelectorAll('.draggable'));
        rows.forEach(row => {
            row.classList.remove('over', 'dragging');
        });
    }

    function updateIndexesAndStorage() {
        let rows = document.querySelectorAll('.metadata-row');
        let newMetadataArray = [];

        rows.forEach((row, newIndex) => {
            let index = row.dataset.index;
            // Update the index attribute
            row.dataset.index = newIndex.toString();

            // Retrieve and update the metadata array based on the new index
            browser.storage.local.get('allMetadata', (data) => {
                newMetadataArray[newIndex] = data.allMetadata[index];

                // When we're done with all the rows, update the local storage
                if (newIndex === rows.length - 1) {
                    browser.storage.local.set({ 'allMetadata': newMetadataArray });
                }
            });
        });
    }

    // Call this function after the drop to update the order in the storage.
    function updateStorageOrder(fromIndex, toIndex) {
        browser.storage.local.get('allMetadata').then(data => {
            let metadata = data.allMetadata || [];
            // Extract the item from the original position and insert it into the new position
            metadata.splice(toIndex, 0, metadata.splice(fromIndex, 1)[0]);
            // Update the storage with the new order
            browser.storage.local.set({ 'allMetadata': metadata }).then(() => {
                // Rebuild the table to reflect the new order
                buildTable();
            });
        });
    }

    // Update the timestamp to be more human readable
    function formatDate(timestamp) {
        // Create a date object from the timestamp
        const date = new Date(timestamp);

        // Options for toLocaleDateString()
        const options = { day: 'numeric', month: 'long', year: 'numeric' };

        // Format the date with the specified options
        return date.toLocaleDateString('en-US', options);
    }

});
