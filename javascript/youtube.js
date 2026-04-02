// Wait for the HTML to fully load before running the script
  document.addEventListener("DOMContentLoaded", () => {
    
    const API_KEY = 'AIzaSyDPqRehZ_4fnFit6VygB19hRjpSE5pXuTs'; // Reminder: Restrict this key!
    const CHANNEL_ID = 'UCa58Tk1Q5DWM2gSDjERWQ8Q'; 

    // Added &type=video so the API doesn't accidentally return a playlist or channel
    const url = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=viewCount&maxResults=2&type=video`;

    fetch(url)
      .then(response => {
        // Add a check to catch any API errors (like quota limits)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.items && data.items.length >= 2) {
          const videoId1 = data.items[0].id.videoId;
          const videoId2 = data.items[1].id.videoId;

          // Inject the correct YouTube embed links
          document.getElementById('vid1').src = `https://www.youtube.com/embed/${videoId1}`;
          document.getElementById('vid2').src = `https://www.youtube.com/embed/${videoId2}`;
        } else {
          console.error("Couldn't find enough videos on this channel.");
        }
      })
      .catch(error => console.error('Error fetching YouTube data:', error));
      
  });
