document.addEventListener('DOMContentLoaded', function () {
    const saveButton = document.getElementById('save-metadata');
    const viewButton = document.getElementById('view-metadata');
    const metadataTable = document.getElementById('metadata-table');
    const metadataBody = document.getElementById('metadata-body');

    saveButton.addEventListener('click', function () {
        // Send a message to the background script to save metadata
        browser.runtime.sendMessage({ action: "saveMetadata" }).then(response => {
            alert(response.message);
        }).catch(error => {
            alert("Error: " + error);
        });
    });

    // Update the viewButton event listener function to include new fields
    viewButton.addEventListener('click', function () {
        // Generate table content
        buildTable();
        // Display table
        metadataTable.style.display = 'table';
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
                deleteButton.textContent = 'x';
                deleteButton.addEventListener('click', () => deleteMetadata(index));
                deleteCell.appendChild(deleteButton);

                // Insert metadata into table
                row.insertCell().textContent = meta.title || 'No title';
                row.insertCell().textContent = meta.url || 'No URL';
                row.insertCell().innerHTML = meta.image ? `<img src="${meta.image}" alt="Image" style="width:100px;">` : 'No image';
                row.insertCell().textContent = meta.author || 'No author';
                row.insertCell().textContent = meta.canonical || 'No canonical URL';
                row.insertCell().textContent = meta.publishDate || 'No publish date';
            });

            // Show the table
            metadataTable.style.display = 'table';
        }).catch(error => {
            alert('Error retrieving metadata: ' + error);
        });
    }

    // Update the viewButton event listener to use buildTable
    viewButton.addEventListener('click', buildTable);
});
