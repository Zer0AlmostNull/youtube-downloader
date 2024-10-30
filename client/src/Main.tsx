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
import Suggestions from './Suggestions';
import { getInfos, getSuggestions } from './utils/API';
import { FormatType, getDownloadUrl, isSuportedUrl } from './utils/helpers';

export default function Main() {
  const { colorMode } = useColorMode();
  const toast = useToast();
  const [downloadUrl, setDownloadUrl] = useState('');
  const [input, setInput] = useState('');
  const [isConvertionLoading, setConvertionLoading] = useState(false);
  const [isSearchLoading, setSearchLoading] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
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
      setConvertionLoading(false);
      downloadBtnRef.current.click();
    }
  }, [downloadUrl]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
  };

  const reset = () => {
    setError(false);
    setInput('');
    setSearchLoading(false);
    setConvertionLoading(false);
  }

  const fetchSuggestions = async () => {
    setError(false);
    setSearchLoading(true);
    try {
      const { data } = await getSuggestions(input, pagingInfo?.nextPageToken);
      setPagingInfo(data.pagingInfo);
      setSuggestions((previousSuggestions) => [
        ...previousSuggestions,
        ...data.data,
      ]);
      setSearchLoading(false);
    } catch (err) {
      setError(true);
      // if (err && err.status === 403) {
      toast({
        title: 'YouTube Search Limit exceeded',
        description:
          'You can search again tomorrow. Just paste the URL into the searchfield. This will still works. The YouTube-API allows only a few search requests.',
        status: 'warning',
        duration: 9000,
        isClosable: true,
      });
      // }
      setTimeout(() => {
        reset();
      }, 2000);
      console.error(err);
    }
  };


  const handleSearch = async () => {


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

    setError(false);
    setConvertionLoading(true);

    try {
      const response = (await getInfos(input));

      const data = JSON.parse(response.data.data) //JSON.parse();

      setError(false);
      setCurrentVideo(data);
      setConvertionLoading(false);
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
            isLoading={
              (isConvertionLoading && !isSearchLoading) ||
              (!isConvertionLoading && isSearchLoading)
            }
          />
          <PreviewBox
            data={currentVideo}
            chooseFormat={startDownload}
            isLoading={isConvertionLoading}
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
