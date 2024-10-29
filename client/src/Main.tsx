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
import { getDownloadUrl, isUrl } from './utils/helpers';

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
        status: 'success',
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

    const _isUrl = isUrl(input);

    if (!input) {
      setError(true);
      toast({
        title: 'This is not valid URL!',
        description:
          'Please provide a valid url!',
        status: 'success',
        duration: 9000,
        isClosable: true,
        colorScheme: 'red'
      });

      reset();
      return;
    }
    if (_isUrl) {
      setError(false);
      setConvertionLoading(true);

      try {
        const { data } = await getInfos(input);
        console.log(data.data);

        setError(false);
        setCurrentVideo(data.data);
        setConvertionLoading(false);
      } catch (err) {

        setError(true);

        toast({
          title: 'URL Error',
          description:
            'Given URL is not supported!',
          status: 'success',
          duration: 9000,
          isClosable: true,
        colorScheme: 'red'
        });

        // }
        setTimeout(() => {
          reset();
        }, 2000);

      }
    }
    setError(true);

  };

  const startDownload = async (format: string, videoMetadata: any) => {
    setDownloadUrl('');
    try {

      const downloadUrl = getDownloadUrl(videoMetadata, format);
      setDownloadUrl(downloadUrl);
      
      const downloadInfo = {
        title: videoMetadata.title,
        imageUrl: videoMetadata.thumbnails[0].url,
        videoLength: videoMetadata.duration,
        format,
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
        <Suggestions
          data={suggestions}
          chooseFormat={startDownload}
          isLoading={isSearchLoading}
        />
        {!!suggestions.length && (
          <Button
            onClick={fetchSuggestions}
            isLoading={isSearchLoading}
            loadingText="Loading more..."
            colorScheme="gray"
            width="100%"
          >
            Load More
          </Button>
        )}
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
