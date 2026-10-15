// Comprehensive list of countries of the world with ISO codes, nationalities (demonyms), flags, and dial codes.

export const COUNTRIES_DATA = [
  // Primary / Default Selected (e.g. Ethiopia)
  { code: 'ET', name: 'Ethiopia', nationality: 'Ethiopian', flag: '🇪🇹', dialCode: '+251', priority: true, format: '911 234 567', digits: 9 },
  { code: 'US', name: 'United States', nationality: 'American', flag: '🇺🇸', dialCode: '+1', priority: true, format: '555 123 4567', digits: 10 },
  { code: 'GB', name: 'United Kingdom', nationality: 'British', flag: '🇬🇧', dialCode: '+44', priority: true, format: '7123 456789', digits: 10 },
  { code: 'CA', name: 'Canada', nationality: 'Canadian', flag: '🇨🇦', dialCode: '+1', priority: true, format: '555 123 4567', digits: 10 },
  { code: 'KE', name: 'Kenya', nationality: 'Kenyan', flag: '🇰🇪', dialCode: '+254', priority: true, format: '712 345 678', digits: 9 },
  { code: 'AE', name: 'United Arab Emirates', nationality: 'Emirati', flag: '🇦🇪', dialCode: '+971', priority: true, format: '50 123 4567', digits: 9 },
  { code: 'DE', name: 'Germany', nationality: 'German', flag: '🇩🇪', dialCode: '+49', priority: true, format: '151 23456789', digits: 10 },
  { code: 'FR', name: 'France', nationality: 'French', flag: '🇫🇷', dialCode: '+33', priority: true, format: '6 12 34 56 78', digits: 9 },
  { code: 'CN', name: 'China', nationality: 'Chinese', flag: '🇨🇳', dialCode: '+86', priority: true, format: '138 0000 0000', digits: 11 },
  { code: 'IN', name: 'India', nationality: 'Indian', flag: '🇮🇳', dialCode: '+91', priority: true, format: '98765 43210', digits: 10 },
  { code: 'ZA', name: 'South Africa', nationality: 'South African', flag: '🇿🇦', dialCode: '+27', priority: true, format: '71 234 5678', digits: 9 },
  { code: 'SA', name: 'Saudi Arabia', nationality: 'Saudi Arabian', flag: '🇸🇦', dialCode: '+966', priority: true, format: '50 123 4567', digits: 9 },
  { code: 'DJ', name: 'Djibouti', nationality: 'Djiboutian', flag: '🇩🇯', dialCode: '+253', priority: true, format: '77 12 34 56', digits: 8 },
  { code: 'SO', name: 'Somalia', nationality: 'Somali', flag: '🇸🇴', dialCode: '+252', priority: true, format: '61 234 5678', digits: 9 },
  { code: 'SD', name: 'Sudan', nationality: 'Sudanese', flag: '🇸🇩', dialCode: '+249', priority: true, format: '91 234 5678', digits: 9 },
  { code: 'SS', name: 'South Sudan', nationality: 'South Sudanese', flag: '🇸🇸', dialCode: '+211', priority: true, format: '91 234 5678', digits: 9 },
  { code: 'ER', name: 'Eritrea', nationality: 'Eritrean', flag: '🇪🇷', dialCode: '+291', priority: true, format: '7 123 456', digits: 7 },
  { code: 'UG', name: 'Uganda', nationality: 'Ugandan', flag: '🇺🇬', dialCode: '+256', priority: true, format: '712 345 678', digits: 9 },
  { code: 'TZ', name: 'Tanzania', nationality: 'Tanzanian', flag: '🇹🇿', dialCode: '+255', priority: true, format: '712 345 678', digits: 9 },
  { code: 'RW', name: 'Rwanda', nationality: 'Rwandan', flag: '🇷🇼', dialCode: '+250', priority: true, format: '788 123 456', digits: 9 },
  { code: 'NG', name: 'Nigeria', nationality: 'Nigerian', flag: '🇳🇬', dialCode: '+234', priority: true, format: '803 123 4567', digits: 10 },
  { code: 'EG', name: 'Egypt', nationality: 'Egyptian', flag: '🇪🇬', dialCode: '+20', priority: true, format: '10 1234 5678', digits: 10 },
  { code: 'IT', name: 'Italy', nationality: 'Italian', flag: '🇮🇹', dialCode: '+39', priority: true, format: '312 345 6789', digits: 10 },
  { code: 'TR', name: 'Turkey', nationality: 'Turkish', flag: '🇹🇷', dialCode: '+90', priority: true, format: '512 345 6789', digits: 10 },

  // Alphabetical List of All Sovereign Countries & Territories in the World
  { code: 'AF', name: 'Afghanistan', nationality: 'Afghan', flag: '🇦🇫', dialCode: '+93', format: '70 123 4567' },
  { code: 'AX', name: 'Åland Islands', nationality: 'Alandic', flag: '🇦🇽', dialCode: '+358', format: '41 234 5678' },
  { code: 'AL', name: 'Albania', nationality: 'Albanian', flag: '🇦🇱', dialCode: '+355', format: '67 123 4567' },
  { code: 'DZ', name: 'Algeria', nationality: 'Algerian', flag: '🇩🇿', dialCode: '+213', format: '55 123 4567' },
  { code: 'AS', name: 'American Samoa', nationality: 'American Samoan', flag: '🇦🇸', dialCode: '+1', format: '684 123 4567' },
  { code: 'AD', name: 'Andorra', nationality: 'Andorran', flag: '🇦🇩', dialCode: '+376', format: '312 345' },
  { code: 'AO', name: 'Angola', nationality: 'Angolan', flag: '🇦🇴', dialCode: '+244', format: '923 123 456' },
  { code: 'AI', name: 'Anguilla', nationality: 'Anguillan', flag: '🇦🇮', dialCode: '+1', format: '264 497 1234' },
  { code: 'AG', name: 'Antigua and Barbuda', nationality: 'Antiguan', flag: '🇦🇬', dialCode: '+1', format: '268 464 1234' },
  { code: 'AR', name: 'Argentina', nationality: 'Argentine', flag: '🇦🇷', dialCode: '+54', format: '9 11 1234 5678' },
  { code: 'AM', name: 'Armenia', nationality: 'Armenian', flag: '🇦🇲', dialCode: '+374', format: '77 123 456' },
  { code: 'AW', name: 'Aruba', nationality: 'Aruban', flag: '🇦🇼', dialCode: '+297', format: '592 1234' },
  { code: 'AU', name: 'Australia', nationality: 'Australian', flag: '🇦🇺', dialCode: '+61', format: '412 345 678' },
  { code: 'AT', name: 'Austria', nationality: 'Austrian', flag: '🇦🇹', dialCode: '+43', format: '664 123 4567' },
  { code: 'AZ', name: 'Azerbaijan', nationality: 'Azerbaijani', flag: '🇦🇿', dialCode: '+994', format: '50 123 4567' },
  { code: 'BS', name: 'Bahamas', nationality: 'Bahamian', flag: '🇧🇸', dialCode: '+1', format: '242 359 1234' },
  { code: 'BH', name: 'Bahrain', nationality: 'Bahraini', flag: '🇧🇭', dialCode: '+973', format: '3600 1234' },
  { code: 'BD', name: 'Bangladesh', nationality: 'Bangladeshi', flag: '🇧🇩', dialCode: '+880', format: '1712 345678' },
  { code: 'BB', name: 'Barbados', nationality: 'Barbadian', flag: '🇧🇧', dialCode: '+1', format: '246 260 1234' },
  { code: 'BY', name: 'Belarus', nationality: 'Belarusian', flag: '🇧🇾', dialCode: '+375', format: '29 123 4567' },
  { code: 'BE', name: 'Belgium', nationality: 'Belgian', flag: '🇧🇪', dialCode: '+32', format: '470 12 34 56' },
  { code: 'BZ', name: 'Belize', nationality: 'Belizean', flag: '🇧🇿', dialCode: '+501', format: '622 1234' },
  { code: 'BJ', name: 'Benin', nationality: 'Beninese', flag: '🇧🇯', dialCode: '+229', format: '90 12 34 56' },
  { code: 'BM', name: 'Bermuda', nationality: 'Bermudian', flag: '🇧🇲', dialCode: '+1', format: '441 500 1234' },
  { code: 'BT', name: 'Bhutan', nationality: 'Bhutanese', flag: '🇧🇹', dialCode: '+975', format: '17 12 34 56' },
  { code: 'BO', name: 'Bolivia', nationality: 'Bolivian', flag: '🇧🇴', dialCode: '+591', format: '7123 4567' },
  { code: 'BA', name: 'Bosnia and Herzegovina', nationality: 'Bosnian', flag: '🇧🇦', dialCode: '+387', format: '61 123 456' },
  { code: 'BW', name: 'Botswana', nationality: 'Motswana', flag: '🇧🇼', dialCode: '+267', format: '71 123 456' },
  { code: 'BR', name: 'Brazil', nationality: 'Brazilian', flag: '🇧🇷', dialCode: '+55', format: '11 91234 5678' },
  { code: 'BN', name: 'Brunei', nationality: 'Bruneian', flag: '🇧🇳', dialCode: '+673', format: '712 3456' },
  { code: 'BG', name: 'Bulgaria', nationality: 'Bulgarian', flag: '🇧🇬', dialCode: '+359', format: '88 123 4567' },
  { code: 'BF', name: 'Burkina Faso', nationality: 'Burkinabe', flag: '🇧🇫', dialCode: '+226', format: '70 12 34 56' },
  { code: 'BI', name: 'Burundi', nationality: 'Burundian', flag: '🇧🇮', dialCode: '+257', format: '79 12 34 56' },
  { code: 'CV', name: 'Cabo Verde', nationality: 'Cape Verdean', flag: '🇨🇻', dialCode: '+238', format: '991 1234' },
  { code: 'KH', name: 'Cambodia', nationality: 'Cambodian', flag: '🇰🇭', dialCode: '+855', format: '12 345 678' },
  { code: 'CM', name: 'Cameroon', nationality: 'Cameroonian', flag: '🇨🇲', dialCode: '+237', format: '6 71 23 45 67' },
  { code: 'KY', name: 'Cayman Islands', nationality: 'Caymanian', flag: '🇰🇾', dialCode: '+1', format: '345 926 1234' },
  { code: 'CF', name: 'Central African Republic', nationality: 'Central African', flag: '🇨🇫', dialCode: '+236', format: '70 12 34 56' },
  { code: 'TD', name: 'Chad', nationality: 'Chadian', flag: '🇹🇩', dialCode: '+235', format: '66 12 34 56' },
  { code: 'CL', name: 'Chile', nationality: 'Chilean', flag: '🇨🇱', dialCode: '+56', format: '9 1234 5678' },
  { code: 'CO', name: 'Colombia', nationality: 'Colombian', flag: '🇨🇴', dialCode: '+57', format: '310 123 4567' },
  { code: 'KM', name: 'Comoros', nationality: 'Comorian', flag: '🇰🇲', dialCode: '+269', format: '321 1234' },
  { code: 'CG', name: 'Congo', nationality: 'Congolese', flag: '🇨🇬', dialCode: '+242', format: '06 123 4567' },
  { code: 'CD', name: 'DR Congo', nationality: 'Congolese (DRC)', flag: '🇨🇩', dialCode: '+243', format: '81 123 4567' },
  { code: 'CK', name: 'Cook Islands', nationality: 'Cook Islander', flag: '🇨🇰', dialCode: '+682', format: '51 234' },
  { code: 'CR', name: 'Costa Rica', nationality: 'Costa Rican', flag: '🇨🇷', dialCode: '+506', format: '8312 3456' },
  { code: 'CI', name: "Cote d'Ivoire", nationality: 'Ivorian', flag: '🇨🇮', dialCode: '+225', format: '07 12 34 56 78' },
  { code: 'HR', name: 'Croatia', nationality: 'Croatian', flag: '🇭🇷', dialCode: '+385', format: '91 123 4567' },
  { code: 'CU', name: 'Cuba', nationality: 'Cuban', flag: '🇨🇺', dialCode: '+53', format: '5 123 4567' },
  { code: 'CW', name: 'Curacao', nationality: 'Curacauan', flag: '🇨🇼', dialCode: '+599', format: '9 512 3456' },
  { code: 'CY', name: 'Cyprus', nationality: 'Cypriot', flag: '🇨🇾', dialCode: '+357', format: '96 123 456' },
  { code: 'CZ', name: 'Czech Republic', nationality: 'Czech', flag: '🇨🇿', dialCode: '+420', format: '601 123 456' },
  { code: 'DK', name: 'Denmark', nationality: 'Danish', flag: '🇩🇰', dialCode: '+45', format: '20 12 34 56' },
  { code: 'DM', name: 'Dominica', nationality: 'Dominican (Dominica)', flag: '🇩🇲', dialCode: '+1', format: '767 275 1234' },
  { code: 'DO', name: 'Dominican Republic', nationality: 'Dominican (Republic)', flag: '🇩🇴', dialCode: '+1', format: '809 234 5678' },
  { code: 'EC', name: 'Ecuador', nationality: 'Ecuadorian', flag: '🇪🇨', dialCode: '+593', format: '99 123 4567' },
  { code: 'SV', name: 'El Salvador', nationality: 'Salvadoran', flag: '🇸🇻', dialCode: '+503', format: '7012 3456' },
  { code: 'GQ', name: 'Equatorial Guinea', nationality: 'Equatorial Guinean', flag: '🇬🇶', dialCode: '+240', format: '222 123 456' },
  { code: 'EE', name: 'Estonia', nationality: 'Estonian', flag: '🇪🇪', dialCode: '+372', format: '512 3456' },
  { code: 'SZ', name: 'Eswatini', nationality: 'Swazi', flag: '🇸🇿', dialCode: '+268', format: '7612 3456' },
  { code: 'FO', name: 'Faroe Islands', nationality: 'Faroese', flag: '🇫🇴', dialCode: '+298', format: '211 234' },
  { code: 'FJ', name: 'Fiji', nationality: 'Fijian', flag: '🇫🇯', dialCode: '+679', format: '701 2345' },
  { code: 'FI', name: 'Finland', nationality: 'Finnish', flag: '🇫🇮', dialCode: '+358', format: '40 123 4567' },
  { code: 'GA', name: 'Gabon', nationality: 'Gabonese', flag: '🇬🇦', dialCode: '+241', format: '06 12 34 56' },
  { code: 'GM', name: 'Gambia', nationality: 'Gambian', flag: '🇬🇲', dialCode: '+220', format: '701 2345' },
  { code: 'GE', name: 'Georgia', nationality: 'Georgian', flag: '🇬🇪', dialCode: '+995', format: '591 123 456' },
  { code: 'GH', name: 'Ghana', nationality: 'Ghanaian', flag: '🇬🇭', dialCode: '+233', format: '24 123 4567' },
  { code: 'GI', name: 'Gibraltar', nationality: 'Gibraltarian', flag: '🇬🇮', dialCode: '+350', format: '5712 3456' },
  { code: 'GR', name: 'Greece', nationality: 'Greek', flag: '🇬🇷', dialCode: '+30', format: '691 234 5678' },
  { code: 'GL', name: 'Greenland', nationality: 'Greenlandic', flag: '🇬🇱', dialCode: '+299', format: '52 12 34' },
  { code: 'GD', name: 'Grenada', nationality: 'Grenadian', flag: '🇬🇩', dialCode: '+1', format: '473 403 1234' },
  { code: 'GU', name: 'Guam', nationality: 'Guamanian', flag: '🇬🇺', dialCode: '+1', format: '671 488 1234' },
  { code: 'GT', name: 'Guatemala', nationality: 'Guatemalan', flag: '🇬🇹', dialCode: '+502', format: '5123 4567' },
  { code: 'GN', name: 'Guinea', nationality: 'Guinean', flag: '🇬🇳', dialCode: '+224', format: '621 12 34 56' },
  { code: 'GW', name: 'Guinea-Bissau', nationality: 'Bissau-Guinean', flag: '🇬🇼', dialCode: '+245', format: '955 12 34 56' },
  { code: 'GY', name: 'Guyana', nationality: 'Guyanese', flag: '🇬🇾', dialCode: '+592', format: '609 1234' },
  { code: 'HT', name: 'Haiti', nationality: 'Haitian', flag: '🇭🇹', dialCode: '+509', format: '34 12 3456' },
  { code: 'HN', name: 'Honduras', nationality: 'Honduran', flag: '🇭🇳', dialCode: '+504', format: '9123 4567' },
  { code: 'HK', name: 'Hong Kong', nationality: 'Hong Konger', flag: '🇭🇰', dialCode: '+852', format: '5123 4567' },
  { code: 'HU', name: 'Hungary', nationality: 'Hungarian', flag: '🇭🇺', dialCode: '+36', format: '20 123 4567' },
  { code: 'IS', name: 'Iceland', nationality: 'Icelandic', flag: '🇮🇸', dialCode: '+354', format: '612 3456' },
  { code: 'ID', name: 'Indonesia', nationality: 'Indonesian', flag: '🇮🇩', dialCode: '+62', format: '812 3456 7890' },
  { code: 'IR', name: 'Iran', nationality: 'Iranian', flag: '🇮🇷', dialCode: '+98', format: '912 345 6789' },
  { code: 'IQ', name: 'Iraq', nationality: 'Iraqi', flag: '🇮🇶', dialCode: '+964', format: '790 123 4567' },
  { code: 'IE', name: 'Ireland', nationality: 'Irish', flag: '🇮🇪', dialCode: '+353', format: '83 123 4567' },
  { code: 'IL', name: 'Israel', nationality: 'Israeli', flag: '🇮🇱', dialCode: '+972', format: '50 123 4567' },
  { code: 'JM', name: 'Jamaica', nationality: 'Jamaican', flag: '🇯🇲', dialCode: '+1', format: '876 210 1234' },
  { code: 'JP', name: 'Japan', nationality: 'Japanese', flag: '🇯🇵', dialCode: '+81', format: '90 1234 5678' },
  { code: 'JO', name: 'Jordan', nationality: 'Jordanian', flag: '🇯🇴', dialCode: '+962', format: '7 9012 3456' },
  { code: 'KZ', name: 'Kazakhstan', nationality: 'Kazakhstani', flag: '🇰🇿', dialCode: '+7', format: '701 123 4567' },
  { code: 'KI', name: 'Kiribati', nationality: 'I-Kiribati', flag: '🇰🇮', dialCode: '+686', format: '720 12345' },
  { code: 'XK', name: 'Kosovo', nationality: 'Kosovar', flag: '🇽🇰', dialCode: '+383', format: '44 123 456' },
  { code: 'KW', name: 'Kuwait', nationality: 'Kuwaiti', flag: '🇰🇼', dialCode: '+965', format: '9123 4567' },
  { code: 'KG', name: 'Kyrgyzstan', nationality: 'Kyrgyzstani', flag: '🇰🇬', dialCode: '+996', format: '700 123 456' },
  { code: 'LA', name: 'Laos', nationality: 'Laotian', flag: '🇱🇦', dialCode: '+856', format: '20 23 123 456' },
  { code: 'LV', name: 'Latvia', nationality: 'Latvian', flag: '🇱🇻', dialCode: '+371', format: '21 234 567' },
  { code: 'LB', name: 'Lebanon', nationality: 'Lebanese', flag: '🇱🇧', dialCode: '+961', format: '71 123 456' },
  { code: 'LS', name: 'Lesotho', nationality: 'Basotho', flag: '🇱🇸', dialCode: '+266', format: '5012 3456' },
  { code: 'LR', name: 'Liberia', nationality: 'Liberian', flag: '🇱🇷', dialCode: '+231', format: '77 012 3456' },
  { code: 'LY', name: 'Libya', nationality: 'Libyan', flag: '🇱🇾', dialCode: '+218', format: '91 234 5678' },
  { code: 'LI', name: 'Liechtenstein', nationality: 'Liechtensteiner', flag: '🇱🇮', dialCode: '+423', format: '660 1234' },
  { code: 'LT', name: 'Lithuania', nationality: 'Lithuanian', flag: '🇱🇹', dialCode: '+370', format: '612 34567' },
  { code: 'LU', name: 'Luxembourg', nationality: 'Luxembourgish', flag: '🇱🇺', dialCode: '+352', format: '621 123 456' },
  { code: 'MO', name: 'Macao', nationality: 'Macanese', flag: '🇲🇴', dialCode: '+853', format: '6612 3456' },
  { code: 'MG', name: 'Madagascar', nationality: 'Malagasy', flag: '🇲🇬', dialCode: '+261', format: '32 12 345 67' },
  { code: 'MW', name: 'Malawi', nationality: 'Malawian', flag: '🇲🇼', dialCode: '+265', format: '99 123 4567' },
  { code: 'MY', name: 'Malaysia', nationality: 'Malaysian', flag: '🇲🇾', dialCode: '+60', format: '12 345 6789' },
  { code: 'MV', name: 'Maldives', nationality: 'Maldivian', flag: '🇲🇻', dialCode: '+960', format: '771 2345' },
  { code: 'ML', name: 'Mali', nationality: 'Malian', flag: '🇲🇱', dialCode: '+223', format: '65 12 34 56' },
  { code: 'MT', name: 'Malta', nationality: 'Maltese', flag: '🇲🇹', dialCode: '+356', format: '9912 3456' },
  { code: 'MH', name: 'Marshall Islands', nationality: 'Marshallese', flag: '🇲🇭', dialCode: '+692', format: '235 1234' },
  { code: 'MR', name: 'Mauritania', nationality: 'Mauritanian', flag: '🇲🇷', dialCode: '+222', format: '22 12 34 56' },
  { code: 'MU', name: 'Mauritius', nationality: 'Mauritian', flag: '🇲🇺', dialCode: '+230', format: '5251 2345' },
  { code: 'MX', name: 'Mexico', nationality: 'Mexican', flag: '🇲🇽', dialCode: '+52', format: '1 55 1234 5678' },
  { code: 'FM', name: 'Micronesia', nationality: 'Micronesian', flag: '🇫🇲', dialCode: '+691', format: '920 1234' },
  { code: 'MD', name: 'Moldova', nationality: 'Moldovan', flag: '🇲🇩', dialCode: '+373', format: '621 12 345' },
  { code: 'MC', name: 'Monaco', nationality: 'Monegasque', flag: '🇲🇨', dialCode: '+377', format: '6 12 34 56 78' },
  { code: 'MN', name: 'Mongolia', nationality: 'Mongolian', flag: '🇲🇳', dialCode: '+976', format: '8812 3456' },
  { code: 'ME', name: 'Montenegro', nationality: 'Montenegrin', flag: '🇲🇪', dialCode: '+382', format: '67 123 456' },
  { code: 'MA', name: 'Morocco', nationality: 'Moroccan', flag: '🇲🇦', dialCode: '+212', format: '650 123 456' },
  { code: 'MZ', name: 'Mozambique', nationality: 'Mozambican', flag: '🇲🇿', dialCode: '+258', format: '82 123 4567' },
  { code: 'MM', name: 'Myanmar (Burma)', nationality: 'Burmese', flag: '🇲🇲', dialCode: '+95', format: '9 212 3456' },
  { code: 'NA', name: 'Namibia', nationality: 'Namibian', flag: '🇳🇦', dialCode: '+264', format: '81 123 4567' },
  { code: 'NR', name: 'Nauru', nationality: 'Nauruan', flag: '🇳🇷', dialCode: '+674', format: '555 1234' },
  { code: 'NP', name: 'Nepal', nationality: 'Nepali', flag: '🇳🇵', dialCode: '+977', format: '984 123 4567' },
  { code: 'NL', name: 'Netherlands', nationality: 'Dutch', flag: '🇳🇱', dialCode: '+31', format: '6 12345678' },
  { code: 'NZ', name: 'New Zealand', nationality: 'New Zealander', flag: '🇳🇿', dialCode: '+64', format: '21 123 4567' },
  { code: 'NI', name: 'Nicaragua', nationality: 'Nicaraguan', flag: '🇳🇮', dialCode: '+505', format: '8123 4567' },
  { code: 'NE', name: 'Niger', nationality: 'Nigerien', flag: '🇳🇪', dialCode: '+227', format: '90 12 34 56' },
  { code: 'KP', name: 'North Korea', nationality: 'North Korean', flag: '🇰🇵', dialCode: '+850', format: '191 234 5678' },
  { code: 'MK', name: 'North Macedonia', nationality: 'Macedonian', flag: '🇲🇰', dialCode: '+389', format: '72 123 456' },
  { code: 'NO', name: 'Norway', nationality: 'Norwegian', flag: '🇳🇴', dialCode: '+47', format: '412 34 567' },
  { code: 'OM', name: 'Oman', nationality: 'Omani', flag: '🇴🇲', dialCode: '+968', format: '9123 4567' },
  { code: 'PK', name: 'Pakistan', nationality: 'Pakistani', flag: '🇵🇰', dialCode: '+92', format: '301 2345678' },
  { code: 'PW', name: 'Palau', nationality: 'Palauan', flag: '🇵🇼', dialCode: '+680', format: '775 1234' },
  { code: 'PS', name: 'Palestine', nationality: 'Palestinian', flag: '🇵🇸', dialCode: '+970', format: '59 123 4567' },
  { code: 'PA', name: 'Panama', nationality: 'Panamanian', flag: '🇵🇦', dialCode: '+507', format: '6123 4567' },
  { code: 'PG', name: 'Papua New Guinea', nationality: 'Papua New Guinean', flag: '🇵🇬', dialCode: '+675', format: '7012 3456' },
  { code: 'PY', name: 'Paraguay', nationality: 'Paraguayan', flag: '🇵🇾', dialCode: '+595', format: '981 123 456' },
  { code: 'PE', name: 'Peru', nationality: 'Peruvian', flag: '🇵🇪', dialCode: '+51', format: '912 345 678' },
  { code: 'PH', name: 'Philippines', nationality: 'Filipino', flag: '🇵🇭', dialCode: '+63', format: '917 123 4567' },
  { code: 'PL', name: 'Poland', nationality: 'Polish', flag: '🇵🇱', dialCode: '+48', format: '512 345 678' },
  { code: 'PT', name: 'Portugal', nationality: 'Portuguese', flag: '🇵🇹', dialCode: '+351', format: '912 345 678' },
  { code: 'PR', name: 'Puerto Rico', nationality: 'Puerto Rican', flag: '🇵🇷', dialCode: '+1', format: '787 234 5678' },
  { code: 'QA', name: 'Qatar', nationality: 'Qatari', flag: '🇶🇦', dialCode: '+974', format: '3312 3456' },
  { code: 'RO', name: 'Romania', nationality: 'Romanian', flag: '🇷🇴', dialCode: '+40', format: '712 345 678' },
  { code: 'RU', name: 'Russia', nationality: 'Russian', flag: '🇷🇺', dialCode: '+7', format: '912 345 6789' },
  { code: 'KN', name: 'Saint Kitts and Nevis', nationality: 'Kittitian', flag: '🇰🇳', dialCode: '+1', format: '869 465 1234' },
  { code: 'LC', name: 'Saint Lucia', nationality: 'Saint Lucian', flag: '🇱🇨', dialCode: '+1', format: '758 456 1234' },
  { code: 'VC', name: 'Saint Vincent and the Grenadines', nationality: 'Vincentian', flag: '🇻🇨', dialCode: '+1', format: '784 457 1234' },
  { code: 'WS', name: 'Samoa', nationality: 'Samoan', flag: '🇼🇸', dialCode: '+685', format: '721 2345' },
  { code: 'SM', name: 'San Marino', nationality: 'Sammarinese', flag: '🇸🇲', dialCode: '+378', format: '66 123 456' },
  { code: 'ST', name: 'Sao Tome and Principe', nationality: 'Sao Tomean', flag: '🇸🇹', dialCode: '+239', format: '981 2345' },
  { code: 'SN', name: 'Senegal', nationality: 'Senegalese', flag: '🇸🇳', dialCode: '+221', format: '70 123 45 67' },
  { code: 'RS', name: 'Serbia', nationality: 'Serbian', flag: '🇷🇸', dialCode: '+381', format: '60 123 4567' },
  { code: 'SC', name: 'Seychelles', nationality: 'Seychellois', flag: '🇸🇨', dialCode: '+248', format: '2 512 345' },
  { code: 'SL', name: 'Sierra Leone', nationality: 'Sierra Leonean', flag: '🇸🇱', dialCode: '+232', format: '76 123 456' },
  { code: 'SG', name: 'Singapore', nationality: 'Singaporean', flag: '🇸🇬', dialCode: '+65', format: '8123 4567' },
  { code: 'SK', name: 'Slovakia', nationality: 'Slovak', flag: '🇸🇰', dialCode: '+421', format: '912 345 678' },
  { code: 'SI', name: 'Slovenia', nationality: 'Slovenian', flag: '🇸🇮', dialCode: '+386', format: '41 123 456' },
  { code: 'SB', name: 'Solomon Islands', nationality: 'Solomon Islander', flag: '🇸🇧', dialCode: '+677', format: '74 12345' },
  { code: 'KR', name: 'South Korea', nationality: 'South Korean', flag: '🇰🇷', dialCode: '+82', format: '10 1234 5678' },
  { code: 'ES', name: 'Spain', nationality: 'Spanish', flag: '🇪🇸', dialCode: '+34', format: '612 345 678' },
  { code: 'LK', name: 'Sri Lanka', nationality: 'Sri Lankan', flag: '🇱🇰', dialCode: '+94', format: '71 234 5678' },
  { code: 'SR', name: 'Suriname', nationality: 'Surinamese', flag: '🇸🇷', dialCode: '+597', format: '741 2345' },
  { code: 'SE', name: 'Sweden', nationality: 'Swedish', flag: '🇸🇪', dialCode: '+46', format: '70 123 4567' },
  { code: 'CH', name: 'Switzerland', nationality: 'Swiss', flag: '🇨🇭', dialCode: '+41', format: '78 123 45 67' },
  { code: 'SY', name: 'Syria', nationality: 'Syrian', flag: '🇸🇾', dialCode: '+963', format: '94 123 4567' },
  { code: 'TW', name: 'Taiwan', nationality: 'Taiwanese', flag: '🇹🇼', dialCode: '+886', format: '912 345 678' },
  { code: 'TJ', name: 'Tajikistan', nationality: 'Tajik', flag: '🇹🇯', dialCode: '+992', format: '91 812 3456' },
  { code: 'TH', name: 'Thailand', nationality: 'Thai', flag: '🇹🇭', dialCode: '+66', format: '81 234 5678' },
  { code: 'TL', name: 'Timor-Leste', nationality: 'Timorese', flag: '🇹🇱', dialCode: '+670', format: '7723 4567' },
  { code: 'TG', name: 'Togo', nationality: 'Togolese', flag: '🇹🇬', dialCode: '+228', format: '90 12 34 56' },
  { code: 'TO', name: 'Tonga', nationality: 'Tongan', flag: '🇹🇴', dialCode: '+676', format: '771 2345' },
  { code: 'TT', name: 'Trinidad and Tobago', nationality: 'Trinidadian', flag: '🇹🇹', dialCode: '+1', format: '868 291 1234' },
  { code: 'TN', name: 'Tunisia', nationality: 'Tunisian', flag: '🇹🇳', dialCode: '+216', format: '20 123 456' },
  { code: 'TM', name: 'Turkmenistan', nationality: 'Turkmen', flag: '🇹🇲', dialCode: '+993', format: '66 123 456' },
  { code: 'TV', name: 'Tuvalu', nationality: 'Tuvaluan', flag: '🇹🇻', dialCode: '+688', format: '90 1234' },
  { code: 'UA', name: 'Ukraine', nationality: 'Ukrainian', flag: '🇺🇦', dialCode: '+380', format: '50 123 4567' },
  { code: 'UY', name: 'Uruguay', nationality: 'Uruguayan', flag: '🇺🇾', dialCode: '+598', format: '94 123 456' },
  { code: 'UZ', name: 'Uzbekistan', nationality: 'Uzbek', flag: '🇺🇿', dialCode: '+998', format: '90 123 4567' },
  { code: 'VU', name: 'Vanuatu', nationality: 'Ni-Vanuatu', flag: '🇻🇺', dialCode: '+678', format: '591 2345' },
  { code: 'VA', name: 'Vatican City', nationality: 'Vatican', flag: '🇻🇦', dialCode: '+379', format: '06 698 12345' },
  { code: 'VE', name: 'Venezuela', nationality: 'Venezuelan', flag: '🇻🇪', dialCode: '+58', format: '412 123 4567' },
  { code: 'VN', name: 'Vietnam', nationality: 'Vietnamese', flag: '🇻🇳', dialCode: '+84', format: '91 234 5678' },
  { code: 'YE', name: 'Yemen', nationality: 'Yemeni', flag: '🇾🇪', dialCode: '+967', format: '71 234 5678' },
  { code: 'ZM', name: 'Zambia', nationality: 'Zambian', flag: '🇿🇲', dialCode: '+260', format: '97 123 4567' },
  { code: 'ZW', name: 'Zimbabwe', nationality: 'Zimbabwean', flag: '🇿🇼', dialCode: '+263', format: '71 234 5678' },
];

/**
 * Returns the flag CDN image URL for a given country ISO code.
 */
export function getFlagUrl(code, width = 40) {
  if (!code) return '';
  return `https://flagcdn.com/w${width}/${code.toLowerCase()}.png`;
}

/**
 * Helper to find country by nationality, name, code, or dial code
 */
export function findCountry(query) {
  if (!query) return null;
  const q = String(query).trim().toLowerCase();
  return (
    COUNTRIES_DATA.find(
      c =>
        c.nationality?.toLowerCase() === q ||
        c.name.toLowerCase() === q ||
        c.code.toLowerCase() === q ||
        c.dialCode.toLowerCase() === q
    ) || null
  );
}

/**
 * Helper to find country by dial code (e.g. "+251")
 */
export function findCountryByDialCode(dialCode) {
  if (!dialCode) return null;
  const clean = dialCode.startsWith('+') ? dialCode : `+${dialCode}`;
  return COUNTRIES_DATA.find(c => c.dialCode === clean) || COUNTRIES_DATA[0];
}

/**
 * Validates Date of Birth and ensures age is greater than or equal to minimum age (default: 18).
 * Returns { valid: boolean, age: number|null, error: string|null }
 */
export function validateDateOfBirth(birthDateInput, minAge = 18) {
  if (!birthDateInput) {
    return { valid: false, age: null, error: 'Date of birth is required.' };
  }

  let dateObj;
  if (birthDateInput instanceof Date) {
    dateObj = birthDateInput;
  } else if (typeof birthDateInput === 'string') {
    const parts = birthDateInput.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      
      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        return { valid: false, age: null, error: 'Please enter a valid date of birth.' };
      }
      
      dateObj = new Date(year, month - 1, day);
      
      if (
        dateObj.getFullYear() !== year ||
        dateObj.getMonth() !== month - 1 ||
        dateObj.getDate() !== day
      ) {
        return { valid: false, age: null, error: 'Invalid calendar date. Please check day and month.' };
      }
    } else {
      dateObj = new Date(birthDateInput);
    }
  }

  if (!dateObj || isNaN(dateObj.getTime())) {
    return { valid: false, age: null, error: 'Enter a valid date of birth.' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (dateObj > today) {
    return { valid: false, age: null, error: 'Date of birth cannot be in the future.' };
  }

  let age = today.getFullYear() - dateObj.getFullYear();
  const monthDiff = today.getMonth() - dateObj.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateObj.getDate())) {
    age--;
  }

  if (age < minAge) {
    return {
      valid: false,
      age,
      error: `You must be at least ${minAge} years old to register. (Calculated age: ${age} ${age === 1 ? 'year' : 'years'})`
    };
  }

  if (age > 120) {
    return {
      valid: false,
      age,
      error: 'Please enter a realistic date of birth (maximum 120 years).'
    };
  }

  return { valid: true, age, error: null };
}

/**
 * Validates international phone number based on selected country dial code.
 * Handles local leading zeros, length checks, and number format validity.
 * Returns { valid: boolean, error: string|null, cleanPhone: string, fullInternational: string }
 */
export function validatePhoneNumber(phoneInput, dialCode = '+251', countryCode = 'ET') {
  if (!phoneInput || !String(phoneInput).trim()) {
    return {
      valid: false,
      error: 'Phone number is required.',
      cleanPhone: '',
      fullInternational: ''
    };
  }

  // Strip spaces, dashes, parentheses
  let digits = String(phoneInput).replace(/\D/g, '');

  if (!digits) {
    return {
      valid: false,
      error: 'Please enter a valid phone number with numbers only.',
      cleanPhone: '',
      fullInternational: ''
    };
  }

  const normalizedDial = dialCode.startsWith('+') ? dialCode : `+${dialCode}`;

  // Ethiopia (+251) Specific Rules
  if (normalizedDial === '+251' || countryCode === 'ET') {
    // If entered with leading 0 (e.g. 0911234567 or 0712345678)
    if (digits.startsWith('0') && digits.length === 10) {
      digits = digits.slice(1);
    }
    // If entered including country code 251911234567
    if (digits.startsWith('251') && digits.length === 12) {
      digits = digits.slice(3);
    }

    if (digits.length < 9) {
      return {
        valid: false,
        error: `Phone number is too short (${digits.length}/9 digits). Example: 911 234 567`,
        cleanPhone: digits,
        fullInternational: `${normalizedDial} ${digits}`
      };
    }

    if (digits.length > 9) {
      return {
        valid: false,
        error: `Phone number is too long (${digits.length}/9 digits). Ethiopian mobile numbers have 9 digits.`,
        cleanPhone: digits,
        fullInternational: `${normalizedDial} ${digits}`
      };
    }

    // Must start with 9 (Ethio Telecom) or 7 (Safaricom)
    if (!digits.startsWith('9') && !digits.startsWith('7')) {
      return {
        valid: false,
        error: 'Ethiopian mobile numbers must start with 9 or 7 (e.g. 911 234 567).',
        cleanPhone: digits,
        fullInternational: `${normalizedDial} ${digits}`
      };
    }

    return {
      valid: true,
      error: null,
      cleanPhone: digits,
      fullInternational: `${normalizedDial} ${digits}`
    };
  }

  // North America (+1) Specific Rules (US, CA, etc.)
  if (normalizedDial === '+1') {
    if (digits.startsWith('1') && digits.length === 11) {
      digits = digits.slice(1);
    }

    if (digits.length !== 10) {
      return {
        valid: false,
        error: `Phone number must be exactly 10 digits for North America (currently ${digits.length}).`,
        cleanPhone: digits,
        fullInternational: `${normalizedDial} ${digits}`
      };
    }

    return {
      valid: true,
      error: null,
      cleanPhone: digits,
      fullInternational: `${normalizedDial} ${digits}`
    };
  }

  // General E.164 rules for all other countries
  if (digits.startsWith('0') && digits.length >= 8) {
    digits = digits.slice(1);
  }

  if (digits.length < 6) {
    return {
      valid: false,
      error: 'Phone number is too short (minimum 6 digits).',
      cleanPhone: digits,
      fullInternational: `${normalizedDial} ${digits}`
    };
  }

  if (digits.length > 15) {
    return {
      valid: false,
      error: 'Phone number cannot exceed 15 digits according to international standards.',
      cleanPhone: digits,
      fullInternational: `${normalizedDial} ${digits}`
    };
  }

  return {
    valid: true,
    error: null,
    cleanPhone: digits,
    fullInternational: `${normalizedDial} ${digits}`
  };
}
