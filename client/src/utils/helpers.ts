/**
 * Check if the url is a valid YouTube-URL.
 * @param url youtube url
 * @returns if it's a YouTube-URL or not
 */
export const isYtUrl = (url: string) => {
  const ytRegex = new RegExp(
    /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\\-]+\?v=|embed\/|v\/)?)([\w\\-]+)(\S+)?$/g
  );
  return ytRegex.test(url);
};

/**
 * Check if the URL is a valid URL.
 * @param url - The URL to check.
 * @returns True if it's a valid URL, otherwise false.
 */
export const isSuportedUrl = (url: string): boolean => {
  // Regular expression for validating a URL

  const urlPattern = /^(https?:\/\/)?(www\.)?(youtube|youtu\.be|instagram|twitter|x|tiktok|vm\.tiktok)([^\s]*)?$/i;
  return urlPattern.test(url);
};

export enum AppState{
  Reset = 0,
  RequestingMetadata = 1,
  DownloadingMetedata = 2,
  ShowingMetadata = 3,
  DownloadingVideo = 4,
};


/**
 * Check if the page is running on localhost (dev environment).
 */
export const isLocalHost = window.location.hostname === 'localhost';

/**
 * Get the current host.
 */
export const host = 'https://api.clipgrab.net';

/**
 * Get download-url from YouTube-Video.
 * @param videoMetadata YouTube-Video-ID
 * @param format Format, e.g. mp4, mp3
 * @returns
 */
export const getDownloadUrl = (videoMetadata: any, format: FormatType) =>
  `${host}/download?url=${videoMetadata.original_url}&format=${format.type??'vid'}`;

/**
 * Available formats to download.
 */
export interface FormatType {
  text: string;
  format: string;
  type: string;
}

export const formats: FormatType[] = [
  { text: 'MP4', format: '.mp4', type: 'vid' },
  { text: 'MP3', format: '.mp3', type: 'aud' }
];

/**
 * Decode a string because sometimes it's with encoded HTML-Entities, e.g. Klaas&#39; ECHTE Mama als Überraschungsgast im Studio! | Late Night Berlin'.
 * Thanks to https://linuxhint.com/decode-html-entities-javascript/
 * @param value Random string, e.g. YouTube-Video-Title
 * @returns decoded string
 */
export const decodeStr = (value: string) => {
  const txt = new DOMParser().parseFromString(value, 'text/html');
  return txt.documentElement.textContent;
};

/**
 *
 * @param seconds Seconds to format into minutes and seconds
 * @returns formatted number
 */
export const formatSecondsToMinutesAndSeconds = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const formattedSeconds =
    remainingSeconds < 10 ? `0${remainingSeconds}` : `${remainingSeconds}`;
  return `${formattedMinutes}:${formattedSeconds}`;
};
