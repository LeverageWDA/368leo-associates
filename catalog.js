/* 368 Leoz Entertainment: the music on the site.
   ----------------------------------------------------------------------
   To add music:
     1. Put the files in the media folders:
          media/audio/   songs (.mp3 or .m4a)
          media/covers/  cover art (.jpg or .png)
          media/video/   music video (.mp4), or use a YouTube link instead
     2. Fill in the lists below. File names must match exactly.

   Example track:
     { title: "Song Name", artist: "Artist Name", file: "media/audio/song-name.mp3", cover: "media/covers/song-name.jpg" }

   Leave a list empty and the site shows a "coming soon" state instead.
   ---------------------------------------------------------------------- */

window.LEOZ_CATALOG = {
  release: {
    title: "",          // e.g. "Music Is the Voice EP"
    artist: "",         // e.g. "368 Leoz"
    description: "",    // one or two sentences about the release
    cover: ""           // e.g. "media/covers/release.jpg"
  },

  tracks: [
    // { title: "", artist: "", file: "media/audio/", cover: "" },
  ],

  video: {
    title: "",          // e.g. "Song Name (Official Video)"
    file: "",           // e.g. "media/video/official-video.mp4"
    poster: "",         // still image shown before play, e.g. "media/covers/video-poster.jpg"
    youtube: ""         // OR a YouTube link, e.g. "https://www.youtube.com/watch?v=XXXXXXXXXXX"
  }
};
