import { ChevronDownIcon, DownloadIcon } from '@chakra-ui/icons';
import {
  Box,
  Heading,
  Image,
  Grid,
  useColorModeValue,
  Text,
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
} from '@chakra-ui/react';
import { formats, FormatType } from './utils/helpers';
import { useEffect, useState } from 'react';

interface Props {
  data: any;
  chooseFormat: (format: FormatType, videoMetadata: any) => void;
}
export default function ConvertBox(props: Props) {
  const { data, chooseFormat } = props;

  const [avaliableFormats, setAvaliableFormats] = useState<FormatType[]>(formats);

  const updateFormats = () => {

    const newformats = formats.filter(
      (item: FormatType) => {
        if (!props.data) return false;


        switch (item.type) {
          case 'aud':
            return props.data.formats.some((item: { acodec?: string; }) => (item.acodec && item.acodec != 'none'));

          case 'vid':
            return props.data.formats.some((item: { vcodec?: string; }) => (item.vcodec && item.vcodec != 'none'));
          default:
            return true;
        }

      }

    );

    console.log(newformats);

    setAvaliableFormats(newformats);
    
  };



  useEffect(() => {
    updateFormats();
  }, [formats, props.data]);
  return (
    <Box
      transition="all .2s ease-in-out"
      bgColor={useColorModeValue('gray.100', 'gray.600')}
      m="5"
      _hover={{
        background: useColorModeValue('gray.200', 'gray.700'),
      }}
      style={{ borderRadius: '10px', overflow: 'hidden' }}
    >
      <Box>
        <Grid alignItems="center" gridAutoFlow="column">
          <Image
            src={data.thumbnails[2].url}
            alt={`Thumbnail of ${data.title}`}
          />
          <Box p="0.5">
            <Heading size="md">{data.title}</Heading>
            <Text mb="5">{data?.author?.name || data?.author?.user}</Text>
            <Menu>
              <MenuButton
                as={Button}
                leftIcon={<DownloadIcon />}
                rightIcon={<ChevronDownIcon />}
              >
                Download
              </MenuButton>
              <MenuList>
                {avaliableFormats && avaliableFormats.map((format) => (
                  <MenuItem
                    key={format.text}
                    onClick={() => {chooseFormat(format, data);}}
                  >
                    {format.text}
                  </MenuItem>
                ))}
                {!avaliableFormats && <MenuItem>No avaliable formats!</MenuItem>}
              </MenuList>
            </Menu>
          </Box>
        </Grid>
      </Box>
    </Box>
  );
}
