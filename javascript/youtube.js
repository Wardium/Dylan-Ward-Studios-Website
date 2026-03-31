<script>
  // 1. Put your actual API Key and Channel ID here
  const API_KEY = 'AIzaSyDPqRehZ_4fnFit6VygB19hRjpSE5pXuTs'; 
  const CHANNEL_ID = 'UCa58Tk1Q5DWM2gSDjERWQ8Q'; 

  // 2. The YouTube API URL that sorts your channel by view count
  const url = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=viewCount&maxResults=2`;

  // 3. Fetch the data and update the iframes
  fetch(url)
    .then(response => response.json())
    .then(data => {
      // Make sure we actually found videos
      if (data.items && data.items.length >= 2) {
        const videoId1 = data.items[0].id.videoId;
        const videoId2 = data.items[1].id.videoId;

        // Inject the video IDs into the iframe source links
        document.getElementById('vid1').src = `https://www.youtube.com/embed/${videoId1}`;
        document.getElementById('vid2').src = `https://www.youtube.com/embed/${videoId2}`;
      } else {
        console.error("Couldn't find enough videos on this channel.");
      }
    })
    .catch(error => console.error('Error fetching YouTube data:', error));
</script>
