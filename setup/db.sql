SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT=0;
START TRANSACTION;
SET time_zone = "+00:00";

-- --------------------------------------------------------

--
-- Table structure for table `KnownMedia`
--

DROP TABLE IF EXISTS `KnownMedia`;
CREATE TABLE IF NOT EXISTS `KnownMedia` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `site` varchar(15) NOT NULL,
  `mediaid` varchar(15) NOT NULL,
  PRIMARY KEY (`site`,`mediaid`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `Playlists`
--

DROP TABLE IF EXISTS `Playlists`;
CREATE TABLE IF NOT EXISTS `Playlists` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `sha256` char(64) CHARACTER SET utf8 NOT NULL,
  `playliststring` mediumtext NOT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sha256` (`sha256`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;
COMMIT;
