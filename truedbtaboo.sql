-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 27, 2025 at 11:24 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `truedbtaboo`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `wins` int(11) DEFAULT 0,
  `games_played` int(11) DEFAULT 0,
  `losses` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `username`, `password_hash`, `created_at`, `wins`, `games_played`, `losses`) VALUES
(1, 'admin', '$2b$10$d8V5DUfmIiFJKwixtrvF8OmmWRw1qy0Nhu3/eKin6aYjhDyP5GVYG', '2025-07-16 04:01:27', 0, 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `cards`
--

CREATE TABLE `cards` (
  `id` int(11) NOT NULL,
  `keyword` varchar(100) NOT NULL,
  `forbidden1` varchar(100) NOT NULL,
  `forbidden2` varchar(100) NOT NULL,
  `forbidden3` varchar(100) NOT NULL,
  `forbidden4` varchar(100) NOT NULL,
  `forbidden5` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cards`
--

INSERT INTO `cards` (`id`, `keyword`, `forbidden1`, `forbidden2`, `forbidden3`, `forbidden4`, `forbidden5`) VALUES
(1, 'king', 'Monarch ', 'Emperor ', 'Sovereign ', 'Autocrat ', 'Regent'),
(3, 'king', 'Monarch', 'Emperor', 'Heir', 'Prince', 'Ruler'),
(4, 'ocean', 'Sea', 'Gulf', 'Harbor', 'Inlet', 'Sound'),
(5, 'ocean', 'fish', 'guts', 'yes', 'no', 'jokes'),
(6, 'ocean', 'fish', 'water', 'sand', 'beach', 'deep'),
(7, 'guts', 'guts', 'guts', 'guts', 'guts', 'guts'),
(11, 'Fish', 'fish', 'fish', 'fish', 'fish', 'fish');

-- --------------------------------------------------------

--
-- Table structure for table `feedback`
--

CREATE TABLE `feedback` (
  `id` int(11) NOT NULL,
  `content` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `game_cards`
--

CREATE TABLE `game_cards` (
  `id` int(11) NOT NULL,
  `game_id` int(11) NOT NULL,
  `card_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `game_logs`
--

CREATE TABLE `game_logs` (
  `id` int(11) NOT NULL,
  `start_time` timestamp NOT NULL DEFAULT current_timestamp(),
  `end_time` timestamp NULL DEFAULT NULL,
  `score_a` int(11) DEFAULT 0,
  `score_b` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `team` varchar(10) NOT NULL,
  `socket_id` varchar(255) NOT NULL,
  `joined_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `game_id` int(11) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `wins` int(11) DEFAULT 0,
  `games_played` int(11) DEFAULT 0,
  `losses` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `team`, `socket_id`, `joined_at`, `game_id`, `password_hash`, `wins`, `games_played`, `losses`) VALUES
(1, 'rudy', '', '', '2025-07-20 13:38:39', NULL, '$2b$10$C2MeN7D2L3yrJiJh2k.FJuIoXh9fGbcK6M2e4mcblSfKNSsO3lYoO', 1, 0, 0),
(2, 'bludclart', '', '', '2025-07-25 16:28:28', NULL, '$2b$10$4uKZWNzsHAhbeXfGF2zm/.O4.L.eCrMFEPGRJknBRCJYcJbNKc7M.', 1, 0, 0);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `cards`
--
ALTER TABLE `cards`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `feedback`
--
ALTER TABLE `feedback`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `game_cards`
--
ALTER TABLE `game_cards`
  ADD PRIMARY KEY (`id`),
  ADD KEY `game_id` (`game_id`),
  ADD KEY `card_id` (`card_id`);

--
-- Indexes for table `game_logs`
--
ALTER TABLE `game_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `game_id` (`game_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `cards`
--
ALTER TABLE `cards`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `feedback`
--
ALTER TABLE `feedback`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `game_cards`
--
ALTER TABLE `game_cards`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `game_logs`
--
ALTER TABLE `game_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `game_cards`
--
ALTER TABLE `game_cards`
  ADD CONSTRAINT `game_cards_ibfk_1` FOREIGN KEY (`game_id`) REFERENCES `game_logs` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `game_cards_ibfk_2` FOREIGN KEY (`card_id`) REFERENCES `cards` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`game_id`) REFERENCES `game_logs` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
