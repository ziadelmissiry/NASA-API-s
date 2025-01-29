/******************************************************
 * NASA Image Search - app.js
 * Description:
 *   Fetches data from the NASA Image and Video Library.
 *   Demonstrates basic search parameters & pagination.
 ******************************************************/

const searchForm = document.getElementById('search-form');
const searchResults = document.getElementById('search-results');

// Track the "Next Page" link, if any
let nextPageUrl = null;

// Listen for form submission
searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  // Clear old results
  searchResults.innerHTML = '';

  // Gather form values
  const query = document.getElementById('search-input').value.trim();
  const yearStart = document.getElementById('year-start').value.trim();
  const yearEnd = document.getElementById('year-end').value.trim();
  const mediaType = document.getElementById('media-type').value;

  // Base API endpoint
  const baseUrl = 'https://images-api.nasa.gov/search';
  const params = new URLSearchParams();

  // Provide a fallback if user enters nothing
  if (query) {
    params.append('q', query);
  } else {
    params.append('q', 'Apollo');
  }

  // Append optional parameters if present
  if (yearStart) {
    params.append('year_start', yearStart);
  }
  if (yearEnd) {
    params.append('year_end', yearEnd);
  }
  if (mediaType) {
    params.append('media_type', mediaType);
  }

  // Build final search URL
  const searchUrl = `${baseUrl}?${params.toString()}`;

  // Fetch & display results
  fetchResults(searchUrl);
});

/**
 * Fetch data from NASA Images API at the given URL
 * and display in the #search-results container.
 */
async function fetchResults(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      // e.g., 400 Bad Request
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const collection = data.collection;

    // Check if items exist
    if (!collection || !collection.items || collection.items.length === 0) {
      searchResults.innerHTML = '<p>No results found.</p>';
      return;
    }

    // Check for pagination "next" link
    const links = collection.links || [];
    const nextLink = links.find(link => link.rel === 'next');
    nextPageUrl = nextLink ? nextLink.href : null;

    // Display items
    displayItems(collection.items);

    // Show a "Load More" button if there's a next page
    if (nextPageUrl) {
      const loadMoreBtn = document.createElement('button');
      loadMoreBtn.textContent = 'Load More';
      loadMoreBtn.addEventListener('click', () => {
        loadMoreBtn.remove();
        fetchResults(nextPageUrl);
      });
      searchResults.appendChild(loadMoreBtn);
    }
  } catch (error) {
    console.error('Error fetching NASA data:', error);
    searchResults.innerHTML = `<p>There was an error: ${error.message}</p>`;
  }
}

/**
 * Display each item in the DOM.
 */
function displayItems(items) {
  items.forEach(item => {
    // item.data is an array, take the first element
    const itemData = (item.data && item.data[0]) ? item.data[0] : {};
    const title = itemData.title || 'Untitled';
    const nasaId = itemData.nasa_id || 'N/A';
    const dateCreated = itemData.date_created || '';
    const description = itemData.description || 'No description.';
    const mediaType = itemData.media_type || 'unknown';

    // item.links often contains a preview thumbnail
    let previewHref = '';
    if (item.links && item.links.length > 0) {
      previewHref = item.links[0].href;
    }

    // Container for the result
    const container = document.createElement('div');
    container.classList.add('result-item');

    // Title
    const titleElem = document.createElement('h3');
    titleElem.textContent = title;
    container.appendChild(titleElem);

    // Preview image/video thumbnail
    if (previewHref) {
      const imgElem = document.createElement('img');
      imgElem.src = previewHref;
      imgElem.alt = title;
      imgElem.classList.add('preview-image');
      container.appendChild(imgElem);
    }

    // Description snippet
    const descElem = document.createElement('p');
    descElem.textContent = description.length > 200
      ? description.substring(0, 200) + '...'
      : description;
    container.appendChild(descElem);

    // Metadata
    const metaElem = document.createElement('p');
    metaElem.innerHTML = `
      <strong>NASA ID:</strong> ${nasaId}<br>
      <strong>Media Type:</strong> ${mediaType}<br>
      <strong>Date Created:</strong> ${
        dateCreated ? new Date(dateCreated).toLocaleDateString() : 'N/A'
      }
    `;
    container.appendChild(metaElem);

    // Append container to search results
    searchResults.appendChild(container);
  });
}
