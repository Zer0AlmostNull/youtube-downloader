import {
  Container,
  Box,
  Heading,
  VisuallyHidden,
  useColorMode,
  Button,
  useToast,
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from '@chakra-ui/react';


import { useEffect, useRef, useState } from 'react';
import Features from './Features';
import FeaturesComingSoon from './FeaturesComingSoon';
import LogoBlack from './Icons/LogoBlack';
import LogoWhite from './Icons/LogoWhite';
import NothingFoundAlert from './NothingFoundAlert';
import PreviewBox from './PreviewBox';
import Search from './Search';
import Sidebar, { HistoryItem } from './Sidebar';
import { AppState, FormatType, getDownloadUrl, isSuportedUrl } from './utils/helpers';
import { getMetadata } from './utils/API';

export default function Main() {
  const { colorMode } = useColorMode();
  const toast = useToast();
  const [downloadUrl, setDownloadUrl] = useState('');
  const [input, setInput] = useState('');

  const [appState, setAppState] = useState<AppState>(AppState.Reset);

  const [currentVideo, setCurrentVideo] = useState(null);
  const [pagingInfo, setPagingInfo] = useState<any>(null);
  const [error, setError] = useState(false);
  const downloadBtnRef = useRef<HTMLAnchorElement>(null);
  const [downloads, setDownloads] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const storedDownloads = localStorage.getItem('downloads');
    if (storedDownloads && JSON.parse(storedDownloads)?.length > 0) {
      setDownloads(JSON.parse(storedDownloads));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('downloads', JSON.stringify(downloads));
  }, [downloads]);

  useEffect(() => {
    if (downloadUrl.length && downloadBtnRef?.current) {
      setAppState(AppState.DownloadingVideo)
      downloadBtnRef.current.click();
    }
  }, [downloadUrl]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
  };

  const reset = () => {
    setError(false);
    setInput('');
    setAppState(AppState.Reset);
  }

  const handleSearch = async () => {

    // change state to reset
    setAppState(AppState.Reset);
    setError(false);

    if (!input || !isSuportedUrl(input)) {
      setError(true);

      toast({
        title: 'This is not valid or supported URL!',
        description:
          'Please provide a valid url!',
        status: 'error',
        duration: 9000,
        isClosable: true,
        colorScheme: 'red'
      });

      return;
    }


    try {
      setAppState(AppState.RequestingMetadata);

      const response = (await getMetadata(input, () => setAppState(AppState.DownloadingMetedata)));

      const data = JSON.parse(response.data.data) //JSON.parse();
      setError(false);
      setCurrentVideo(data);
      setAppState(AppState.ShowingMetadata);
    } catch (err) {

      setError(true);

      toast({
        title: 'Internal server error!',
        description:
          'Please contanct the administrator!',
        status: 'error',
        duration: 9000,
        isClosable: true,
        colorScheme: 'red'
      });

      console.error(err);

      // }
      setTimeout(() => {
        reset();
      }, 2000);

    }



  };

  const startDownload = async (format: FormatType, videoMetadata: any) => {
    setDownloadUrl('');
    try {

      const downloadUrl = getDownloadUrl(videoMetadata, format);
      setDownloadUrl(downloadUrl);

      const downloadInfo: HistoryItem = {
        title: videoMetadata.title,
        imageUrl: videoMetadata.thumbnails[0].url,
        videoLength: videoMetadata.duration,
        format: format.type,
        date: new Date(),
      };
      setDownloads((prevState) => [...prevState, downloadInfo]);
    } catch (err) {
      setError(true);
    }
  };

  const handleDeleteHistory = () => {
    localStorage.removeItem('downloads');
    setDownloads([]);
  };

  return (
    <>
      <Sidebar
        historyData={downloads}
        handleDeleteHistory={handleDeleteHistory}
      />
      <Container maxW="container.md">
        <Box textAlign="center" fontSize="xl">
          <Box mt="5" mb="5">
            <Heading size="2xl" mb="2">
              {colorMode === 'light' ? <LogoBlack /> : <LogoWhite />}
            </Heading>
          </Box>
          <Search
            handleChange={handleChange}
            handleSearch={handleSearch}
            error={error}
            input={input}
            loadingState={appState}
          />
          <PreviewBox
            data={currentVideo}
            chooseFormat={startDownload}
            loadingState={appState}
          />
        </Box>
        {pagingInfo?.totalResults === 0 && <NothingFoundAlert />}
        <Features />
        <FeaturesComingSoon />
      </Container>
      <VisuallyHidden>
        <a href={downloadUrl} download ref={downloadBtnRef}>
          {downloadUrl}
        </a>
      </VisuallyHidden>
    </>
  );
}
