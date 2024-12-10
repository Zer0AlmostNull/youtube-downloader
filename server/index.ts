import express, { Express, Request, Response } from 'express';
import cors from 'cors';

//import { sendMail } from './sendMail';
import compression from 'compression';

import YTDlpWrap from 'yt-dlp-wrap';

import { LRUCache } from 'lru-cache'
import { fetchAndCache } from './cache';
import { escapeFileName } from './helper';

import { spawn, execSync, spawnSync } from 'child_process';


function removeParamsFromUrl(url: string) {
  // Check if 'tiktok' is present in the URL
  if (url.includes('tiktok')) {
    // Create a new URL object to parse the URL
    const parsedUrl = new URL(url);

    // Remove the search (query parameters)
    parsedUrl.search = ''; // Clears all query parameters

    // Return the modified URL
    return parsedUrl.toString();
  }
  return url; // If 'tiktok' is not in the URL, return it as is
}

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

      try {

        const binary = 'yt-dlp';
        const video_args = [
          '--dump-json',
          url
        ];
        //const process = spawn(binary, video_args, { shell: false, stdio: ['ignore', 'pipe', 'pipe'] },);
        //console.log(`${binary} ${video_args.join(' ')}`)
        const result = spawnSync(binary, video_args, { shell: false, stdio: ['pipe', 'pipe', 'pipe'] });
        const stdout = result.stdout.toString();  // Convert the stdout buffer to a string

        // Capture stderr if needed
        const stderr = result.stderr.toString();

        // Capture the exit status
        const exitCode = result.status;

        
        if (exitCode == 0) {
          return JSON.parse(stdout);
        }
        else {
          return undefined;
        }
      }
      catch (error: any) {
        console.log(error);

        return undefined;
      }

    });
    
    return result;
  }
  catch {
    return undefined;
  }
}

const supportedUrlPattern = /^(https?:\/\/)?(www\.)?(youtube|youtu\.be|instagram|twitter|x|tiktok|vm\.tiktok)([^\s]*)?$/i;

const app: Express = express();
const port: string | number = process.env.PORT || 4000;
import * as fs_ from 'fs';


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
  let url = req.query.url as string;

  url = removeParamsFromUrl(url);

  if (!supportedUrlPattern.test(url)) {
    res.status(400).json({ success: false, message: 'Unsupported website!' });
  }



  const result = await getMetadata(url);

  if (result) {
    res.status(200).json({ success: true, data: result });
  }
  else {
    res.status(400).json({ success: false, message: 'Internal server error!' });
  }
});

/**
 * Download a video with the selected format.
 */

let x = 0;
app.get('/download', async (req: Request, res: Response) => {
  try {
    let url: string = (req.query.url as string);
    const format: string = (req.query.format as string || 'vid');


    url = removeParamsFromUrl(url);

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


        const video_command = 'yt-dlp';
        const video_args = [
          '-f', 'bestvideo+bestaudio/best',
          '-S', '+vcodec:h264,+acodec:mp3',
          '--recode-video', 'mp4',
          '--no-playlist',
          '-q',
          '-o', '-',
          url
        ];
        const video_process = spawn(video_command, video_args, { shell: false, stdio: ['ignore', 'pipe', 'pipe'] },);

        video_process.stdout.pipe(res);

        res.on('close', () => {
          video_process.kill();
          logToFile(`Connection closed for: ${url}`);
        })

        video_process.on('error', async (error) => {
          await logToFile(`Failed to start process: ${error.message}`);
          res.end();
        });
        // End the response when the process finishes
        video_process.on('close', async (code) => {
          await logToFile(`\nProcess exited with code ${code}`);
          res.end();
        });

        break;
      case 'aud':

        res.writeHead(200, {
          'Content-Type': 'audio/mpeg',
          'Content-Disposition': `attachment; filename="${title}.mp3"`,
          'Connection': 'keep-alive',
          'Transfer-Encoding': 'chunked',
          'Accept-Ranges': 'bytes',
        })


        const audio_command = 'yt-dlp';
        const audio_args = [
          '-f', 'bestaudio/best',
          '-S', '+vcodec:h264,+acodec:mp3',
          '--audio-format', 'mp3',
          '--recode-video', 'mp3',
          '-q',
          '-o', '-',
          url
        ];
        //const debug_file = fs_.createWriteStream(`yt_dlp${x}.mp3`);
        //const debug_file_ff = fs_.createWriteStream(`ff${x}.mp3`);


        const ffmpeg_command = 'ffmpeg';
        const ffmpeg_args = [
          '-i', '-',
          '-f', 'mp3',
          '-'
        ];
        const audio_process = spawn(audio_command, audio_args, { shell: false, stdio: ['ignore', 'pipe', 'pipe'] },);
        const ffmpeg_process = spawn(ffmpeg_command, ffmpeg_args, { stdio: ['pipe', 'pipe', 'pipe'] });

        audio_process.stdout.pipe(ffmpeg_process.stdin);
        //audio_process.stdout.pipe(debug_file);


        ffmpeg_process.stdout.pipe(res);


        res.on('close', () => {
          audio_process.kill();
          ffmpeg_process.kill();
          logToFile(`Connection closed for (audio): ${url}`);
        })


        ffmpeg_process.on('error', async (error) => {
          await logToFile(`Failed to convert file (ffmpeg): ${error.message}`);
          audio_process.kill();
          res.end();
        });


        audio_process.on('error', async (error) => {
          await logToFile(`Failed to start process: ${error.message}`);
          res.end();
        });

        // End the response when the process finishes
        audio_process.on('close', async (code) => {
          await logToFile(`\nProcess exited with code ${code}`);
          res.end();
        });

        break;
      default:
        res.status(400).json({ success: false, error: 'No valid format!' });
        return;
    }
  } catch (error) {
    await logToFile(`Error during download process: ${error}`);
    //res.status(500).json({ success: false, message: 'Error processing download' });
  }


});