import express, { Express, Request, Response } from 'express';
import cors from 'cors';

//import { sendMail } from './sendMail';

import YTDlpWrap from 'yt-dlp-wrap';

import { LRUCache } from 'lru-cache'
import { fetchAndCache } from './cache';


const ytDlpWrap: YTDlpWrap = new YTDlpWrap();

const formatCache = new LRUCache<string, any>({
  max: 200,             // Maximum items allowed in cache
  ttl: 1000 * 60 * 60    // Default TTL of 5 minutes (in milliseconds)
});


const getFormatJSON = async (url: string): Promise<unknown | undefined> => {

  try {
    const result = await fetchAndCache(formatCache, url, async (param: string) => {
      const value = await ytDlpWrap.getVideoInfo(
        param
      );


      return JSON.stringify(value);
    });

    return result
  }
  catch {
    return undefined;
  }
}

(async () => {

  //console.log(JSON.stringify(await getFormatJSON('https://www.youtube.com/watch?v=aqz-KE-bpKQ')))
  //console.log(await getFormatJSON('https://www.youtube.com/watch?v=aqz-KE-bpKQ'))
  //  console.log((await getFormatJSON('https://www.youtube.com/watch?v=aqz-KE-bpKQ') as string).slice(0, 10));
  //  console.log((await getFormatJSON('https://www.youtube.com/watch?v=aqz-KE-bpKQ') as string).slice(0, 10));
  //  console.log((await getFormatJSON('https://x.com/weirddalle/status/1850118117587878140') as string).slice(0, 10));

})()


//dotenv.config();

const supportedUrlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|instagram\.com|twitter\.com)(\/[^\s]*)?$/i;

const app: Express = express();
const port: string | number = process.env.PORT || 4000;


app.listen(port, () => console.log(`Server is running on port ${port}`));
app.use(cors());
app.use(express.json());

/*
app.post('/contact', async (req: Request, res: Response) => {
  try {
    const { email, issueType, description } = req.body;

    if (!email || !issueType || !description) {
      res.status(400).json({ message: 'All fields are required.' });
    }
    const mailOptions = {
      from: `"YouTubdle.com" ${process.env.MAIL_USER}`,
      to: process.env.MAIL_TO as string,
      subject: "YouTubdle.com Form",
      replyTo: email,
      text: `Nachricht von: ${email}\n\n${description}`,
    };

    const result = await sendMail(mailOptions);

    if (result.success) {
      res.json({ success: true, message: 'Deine Nachricht wurde erfolgreich gesendet.' });
    } else {
      res.status(500).json({ success: false, message: 'Fehler beim Senden deiner Nachricht.' });
    }
  } catch (error) {
    console.error('Error while sending the email:', error);
    res.status(500).send('Some error occurred while sending the email.');
  }
});
*/



/**
 * Get information about a video.
 */
app.get('/metainfo', async (req: Request, res: Response) => {
  const url = req.query.url as string;

  if (!supportedUrlPattern.test(url)) {
    res.status(400).json({ success: false, message: 'Unsupported website!' });
  }


  const result = await getFormatJSON(url);

  if (result) {
    res.status(200).json({ success: true, data: result });
  }
  else {
    res.status(400).json({ success: false, message: 'Unsupported website!' });
  }
});

/**
 * Download a video with the selected format.
 */
app.get('/download', async (req: Request, res: Response) => {
  const url: string = (req.query.url as string);
  const format: string = (req.query.format as string || 'vid');

  if (!supportedUrlPattern.test(url)) {
    res.status(400).json({ success: false, message: 'Unsupported website!' });
  }

  switch (format) {
    case 'vid':
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', 'attachment; filename="download.mp4"');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Transfer-Encoding', 'chunked')
      res.setHeader('Accept-Ranges', 'bytes');

      let readableAVStream = ytDlpWrap.execStream([
        url,
        '-f',
        'bestvideo+bestaudio/best',
        //'--remux-video', 'mp4'
        //'--print-traffic',
        '--remux-video', 'mp4',// <- recode id nescessart
        '--no-playlist'
      ]).on('ytDlpEvent', (eventType, eventData) =>
        console.log(eventType, eventData))
        .on('error', (error) => console.error(error))
        .on('close', () => console.log('all done'));

      readableAVStream.pipe(res);

      readableAVStream.on('error', (err) => {
        console.log(err)
        res.json({ success: false, error: err.message });
      });


      break;
    case 'aud':
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Disposition', 'attachment; filename="download.mp3"');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Transfer-Encoding', 'chunked')
      res.setHeader('Accept-Ranges', 'bytes');

      let readableAudioStream = ytDlpWrap.execStream([
        url,
        '-f', 'bestaudio/best',
        '-x',
        '--audio-format', 'mp3'
        //'--recode-video', 'mp3'// <- recode id nescessart

      ]).on('ytDlpEvent', (eventType, eventData) =>
        console.log(eventType, eventData))
        .on('error', (error) => console.error(error))
        .on('close', () => console.log('all done'));

      readableAudioStream.pipe(res);

      readableAudioStream.on('error', (err) => {
        console.log(err)
        res.json({ success: false, error: err.message });
      });

      break;

    default:
      res.status(400).json({ success: false, error: 'No valid format!' });
      return;
  }

});