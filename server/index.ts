import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import ytdl from '@distube/ytdl-core';
import contentDisposition from 'content-disposition';
import dotenv from 'dotenv';
import { sendMail } from './sendMail';

import YTDlpWrap from 'yt-dlp-wrap';
import { format } from 'path';
import { pipeline } from 'stream';



dotenv.config();
const ytDlpWrap: YTDlpWrap = new YTDlpWrap();

const app: Express = express();
const port: string | number = process.env.PORT || 4000;


app.listen(port, () => console.log(`Server is running on port ${port}`));
app.use(cors());
app.use(express.json());

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

app.get('/formats', async (req: Request, res: Response) => {
  try {
    const videoURL: string = req.query.url as string;

    const raw_formats = await ytDlpWrap.execPromise([
      videoURL,
      '--list-formats', '-j'
    ])

    res.status(200).json(JSON.parse(raw_formats).formats);

  } catch (error) {
    console.error('Error while getting the formats:', error);
    res.status(500).send('Some error occurred while getting the formats.');
  }
});


/**
 * Get information about a video.
 */
app.get('/metainfo', async (req: Request, res: Response) => {
  const url = req.query.url as string;

  try {
    const result = await ytDlpWrap.getVideoInfo(
      url
    );
    res.status(200).json({ success: true, data: result });

  } catch (error: any) {

    if ((error.toString().includes('[generic]'))) {
      res.status(404).json({ success: false, message: 'Unsupported website!' });
    }
    else {
      res.status(400).json({ success: false, error });
    }

  }
});

/**
 * Download a video with the selected format.
 */
app.get('/download', async (req: Request, res: Response) => {
  const url: string = (req.query.url as string);
  const ext: string = (req.query.ext as string).trim() ?? '.mp4';

  switch (ext) {
    case '.mp4':

      
      
      res.setHeader('Content-Type', 'video/mp4'); // Set content type
      //res.setHeader('Content-Disposition', 'inline'); // Optionally specify how to handle content
      res.setHeader('Content-Disposition', 'attachment; filename="download.mp4"'); // Prompt download with filename
      res.setHeader('Accept-Ranges', 'bytes'); // Support for seeking

      let readableStream = ytDlpWrap.execStream([
        url,
        '-f',
        'bestvideo[ext=mp4]+bestaudio/bestvideo+bestaudio',
        '--merge-output-format', 'mp4'
      ]);

      readableStream.pipe(res);

      readableStream.on('error', (err) => {
        console.log(err)
        //res.status(500).json({ success: false, error: err.message });
      });


      break;
    case '.mp3':
      res.status(200).json({ success: false, error: 'MP3!' });


      break;

    default:
      res.status(404).json({ success: false, error: 'No valid format!' });
      return;
  }


  //res.status(200).json({ success: false, error: 'Not implemented yet!' });
  /*
  return;

  if (url === undefined || (!ytdl.validateID(url) && !ytdl.validateURL(url))) {
    res.status(400).json({ success: false, error: 'No valid YouTube Id!' });
  }

  const formats = ['.mp4', '.mp3', '.mov', '.flv'];
  let format: string = formats.includes(f) ? f : '.mp4';

  try {
    const result = await ytdl.getBasicInfo(url as string);
    const {
      videoDetails: { title },
    } = result;
    res.setHeader('Content-Disposition', contentDisposition(`${title}${format}`));

    let filterQuality: 'audioandvideo' | 'audioonly' = format === '.mp3' ? 'audioonly' : 'audioandvideo';
    ytdl(url as string, { filter: filterQuality })
      .pipe(res);
  } catch (err: any) {
    console.error('error', err);
    res.redirect(`http://${req.headers.host}?error=downloadError`);
  }*/
});