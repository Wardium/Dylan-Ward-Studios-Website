// Wait for the HTML to fully load before running the script
document.addEventListener("DOMContentLoaded", () => {
    
    const API_KEY = 'AIzaSyDPqRehZ_4fnFit6VygB19hRjpSE5pXuTs'; // Reminder: Restrict this key!
    const CHANNEL_ID = 'UCa58Tk1Q5DWM2gSDjERWQ8Q'; 

    // Fetch a larger batch (e.g., 15) to ensure we have enough long-form videos left over
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=viewCount&maxResults=15&type=video`;

    fetch(searchUrl)
        .then(response => {
            if (!response.ok) throw new Error(`Search HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(searchData => {
            if (!searchData.items || searchData.items.length < 4) {
                throw new Error("Couldn't find enough videos on this channel.");
            }

            // Extract the video IDs into a comma-separated string
            const videoIds = searchData.items.map(item => item.id.videoId).join(',');

            // Make the second API call to get durations
            const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${API_KEY}&part=contentDetails&id=${videoIds}`;
            return fetch(detailsUrl);
        })
        .then(response => {
            if (!response.ok) throw new Error(`Details HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(detailsData => {
            const allVideos = detailsData.items;

            // --- Slots 1 & 2: Top 2 Popular (Shorts Allowed) ---
            // We just take the first two videos from the list, regardless of length
            const topOverall = allVideos.slice(0, 2);
            
            // --- Slots 3 & 4: Top 2 Long-Form (No Shorts Allowed) ---
            // 1. Remove the two we just used so we don't get duplicates
            const remainingVideos = allVideos.slice(2);
            
            // 2. Filter the remaining ones to only keep videos with Minutes (M) or Hours (H)
            const longVideos = remainingVideos.filter(item => {
                const duration = item.contentDetails.duration;
                return duration.includes('M') || duration.includes('H');
            });

            // Make sure we successfully found enough videos
            if (topOverall.length >= 2 && longVideos.length >= 2) {
                
                // Inject Top 2 Overall (vid1, vid2)
                document.getElementById('vid1').src = `https://www.youtube.com/embed/${topOverall[0].id}`;
                document.getElementById('vid2').src = `https://www.youtube.com/embed/${topOverall[1].id}`;

                // Inject Top 2 Long-Form (vid3, vid4)
                document.getElementById('vid3').src = `https://www.youtube.com/embed/${longVideos[0].id}`;
                document.getElementById('vid4').src = `https://www.youtube.com/embed/${longVideos[1].id}`;
                
            } else {
                console.error("Couldn't find enough matching videos (need 2 overall, 2 long-form).");
            }
        })
        .catch(error => console.error('Error fetching YouTube data:', error));
});
