-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le : ven. 27 juin 2025 à 09:39
-- Version du serveur : 9.1.0
-- Version de PHP : 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `project-angular-dw2`
--

-- --------------------------------------------------------

--
-- Structure de la table `materiel`
--

DROP TABLE IF EXISTS `materiel`;
CREATE TABLE IF NOT EXISTS `materiel` (
  `id_materiel` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `name_materiel` varchar(255) NOT NULL,
  `description_materiel` varchar(255) NOT NULL,
  `capacite_materiel` int NOT NULL,
  `id_createur` int DEFAULT NULL,
  PRIMARY KEY (`id_materiel`),
  UNIQUE KEY `id_materiel` (`id_materiel`),
  KEY `fk_createur_materiel` (`id_createur`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `materiel`
--

INSERT INTO `materiel` (`id_materiel`, `name_materiel`, `description_materiel`, `capacite_materiel`, `id_createur`) VALUES
(1, 'Mac', 'IMac 256 go', 256, 14),
(2, 'Macbook Pro', 'Macbook Pro écran Retina 128go', 128, 14),
(5, 'Asus', 'Zenbook 14\"', 256, 14),
(9, 'IMac 5', 'IMac 16:9', 256, 13),
(10, 'MacBook Air', 'MacBook Air 11\"', 128, 13),
(11, 'Mac ', 'Apple Mac', 0, 13);

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `materiel`
--
ALTER TABLE `materiel`
  ADD CONSTRAINT `fk_createur_materiel` FOREIGN KEY (`id_createur`) REFERENCES `utilisateur` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
