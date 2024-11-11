import {
  Box,
  Flex,
  HStack,
  Link,
  useColorModeValue,
  Heading,
  useColorMode,
} from '@chakra-ui/react';
import { ColorModeSwitcher } from './ColorModeSwitcher';
import LogoBlackNoSlogan from './Icons/LogoBlackNoSlogan';
import LogoWhiteNoSlogan from './Icons/LogoWhiteNoSlogan';
import { isLocalHost } from './utils/helpers';

import white_logo from './Icons/white_logo.png';
import black_logo from './Icons/black_logo.png';

// const Links = ['Dashboard', 'Projects', 'Team'];

// const NavLink = ({ children }: { children: ReactNode }) => (
//   <Link
//     px={2}
//     py={1}
//     rounded={'md'}
//     _hover={{
//       textDecoration: 'none',
//       bg: useColorModeValue('gray.200', 'gray.700'),
//     }}
//     href={'#'}
//   >
//     {children}
//   </Link>
// );

export default function Navbar() {
  // const { isOpen, onOpen, onClose } = useDisclosure();
  const { colorMode } = useColorMode();
  return (
    <>
      <Box bg={useColorModeValue('gray.100', 'gray.900')} px={4}>
        <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
          {/* <IconButton
            size={'md'}
            icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
            aria-label={'Open Menu'}
            display={{ md: 'none' }}
            onClick={isOpen ? onClose : onOpen}
          /> */}
          <Link
            href={`${isLocalHost
              ? 'http://localhost:3000'
              : 'https://youtubdle.com'
              }`}
            _hover={{ textDecoration: 'none', color: 'gray.500' }}
            style={{ height: '100%', width: 'auto' }}

          >
            {colorMode === 'light' ? <img src={black_logo} alt="logoblack" style={{ height: '100%', width: 'auto', maxWidth: '100%' }}
            ></img> : <img src={white_logo} alt="logowhite" style={{ height: '100%', width: 'auto', maxWidth: '100%' }}
            ></img>}

          </Link>
          {/* <HStack
              as={'nav'}
              spacing={4}
              display={{ base: 'none', md: 'flex' }}
            >
              {Links.map((link) => (
                <NavLink key={link}>{link}</NavLink>
              ))}
            </HStack> */}
          <Flex alignItems={'center'}>
            <ColorModeSwitcher />
          </Flex>
        </Flex>

        {/* {isOpen ? (
          <Box pb={4} display={{ md: 'none' }}>
            <Stack as={'nav'} spacing={4}>
              {Links.map((link) => (
                <NavLink key={link}>{link}</NavLink>
              ))}
            </Stack>
          </Box>
        ) : null} */}
      </Box>
    </>
  );
}
