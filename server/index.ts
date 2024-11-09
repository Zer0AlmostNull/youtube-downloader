import express, { Express, Request, Response } from 'express';
import cors from 'cors';

//import { sendMail } from './sendMail';
import compression from 'compression';

import YTDlpWrap from 'yt-dlp-wrap';

import { LRUCache } from 'lru-cache'
import { fetchAndCache } from './cache';
import { escapeFileName } from './helper';

// !!! IMPORTANT 
// requires binaries of ffmpeg and yt-dlp to function


const ytDlpWrap: YTDlpWrap = new YTDlpWrap();

const metadataCache = new LRUCache<string, any>({
  max: 200,             // Maximum items allowed in cache
  ttl: 1000 * 60 * 60    // Default TTL of 5 minutes (in milliseconds)
});


const getMetadata = async (url: string): Promise<any | undefined> => {

  try {
    const result = await fetchAndCache(metadataCache, url, async (param: string) => {
      const value = await ytDlpWrap.getVideoInfo(
        param
      );

      return (value);
    });

    return result
  }
  catch {
    return undefined;
  }
}

const supportedUrlPattern = /^(https?:\/\/)?(www\.)?(youtube|youtu\.be|instagram|twitter|x|tiktok|vm.tiktok)([^\s]*)?$/i;

const app: Express = express();
const port: string | number = process.env.PORT || 4000;


import fs from 'fs/promises'; // Async fs with Promises
import path from 'path';

const logFilePath = path.join(__dirname, 'server.log');

// Asynchronous non-blocking logging function
const logToFile = async (message: string) => {
  const timestamp = new Date().toISOString();
  try {
    await fs.appendFile(logFilePath, `[${timestamp}] ${message}\n`);
  } catch (err) {
    console.error('Failed to write to log file:', err);
  }
};


app.listen(port, () => console.log(`Server is running on port ${port}`));
app.use(cors());
app.use(express.json());
app.use(compression({
  level: 6,
  threshold: 1024,
}));

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


  const result = await getMetadata(url);

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
  try {
    const url: string = (req.query.url as string);
    const format: string = (req.query.format as string || 'vid');

    if (!supportedUrlPattern.test(url)) {
      res.status(400).json({ success: false, message: 'Unsupported website!' });
    }
    console.log(`download request: ${url}`);
    let title = 'download'

    const metadata: any | undefined = await getMetadata(url);
    if (metadata !== undefined) {
      title = (metadata as { title?: string }).title ?? title;
      title = escapeFileName(title)
    }


    let controller = new AbortController();
    res.on('close', () => {
      controller.abort()
    });


    switch (format) {
      case 'vid':


        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Disposition', `attachment; filename="${title}.mp4"`);
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Transfer-Encoding', 'chunked');
        res.setHeader('Accept-Ranges', 'bytes');

        let readableAVStream = ytDlpWrap.execStream([
          url,
          '-f',
          'bestvideo+bestaudio/best',
          //'--remux-video', 'mp4'
          //'--print-traffic',
          '--remux-video', 'mp4',// <- recode id nescessary
          '--no-cache-dir',
          '--no-playlist'
        ], undefined, controller.signal).on('ytDlpEvent', (eventType, eventData) =>
          console.log(eventType, eventData))
          .on('error', async (error) => await logToFile(`Download error (video): ${error}`))
          .on('close', async () => await logToFile(`Video download closed: ${url}`));

        readableAVStream.on('error', async (err) => { console.log(err); await logToFile(`Video stream error: ${url}`) });

        readableAVStream.pipe(res);

      case 'aud':

        res.writeHead(200, {
          'Content-Type': 'audio/mpeg',
          'Content-Disposition': `attachment; filename="${title}.mp3"`,
          'Connection': 'keep-alive',
          'Transfer-Encoding': 'chunked',
          'Accept-Ranges': 'bytes',
        })

        let readableAudioStream = ytDlpWrap.execStream([
          url,
          '-f', 'bestaudio/best',
          '-x',
          '--audio-format', 'mp3',
          '--no-cache-dir',
          '--recode-video', 'mp3'// <- recode id nescessart

        ], undefined, controller.signal).on('ytDlpEvent', (eventType, eventData) =>
          console.log(eventType, eventData))
          .on('error', async (error) => await logToFile(`Download error (audio): ${error}`))
          .on('close', async () => await logToFile(`Audio download complete: ${url}`));

        readableAudioStream.on('error', async (err) => { console.log(err); await logToFile(`Audio stream error: ${url}`) });

        readableAudioStream.pipe(res);
       
      default:
        res.status(400).json({ success: false, error: 'No valid format!' });
        return;
    }
  } catch (error) {
    await logToFile(`Error during download process: ${error}`);
    //res.status(500).json({ success: false, message: 'Error processing download' });
  }


});