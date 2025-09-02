import React from 'react';
import { MdSettings } from 'react-icons/md';
import { Icon } from '@chakra-ui/react';
import { MdCalendarToday } from 'react-icons/md'; 
import { MdPeople } from 'react-icons/md'; 


import {
  MdBarChart,
  MdPerson,
  MdHome,
  MdLock,
  MdOutlineShoppingCart,
} from 'react-icons/md';

// Admin Imports
import MainDashboard from 'views/admin/default';
import NFTMarketplace from 'views/admin/marketplace';
import Profile from 'views/admin/profile';
import DataTables from 'views/admin/dataTables';
import RTL from 'views/admin/rtl';

// Auth Imports
import SignInCentered from 'views/auth/signIn';

const routes = [
  {
    name: 'Main Dashboard',
    layout: '/admin',
    path: '/default',
    icon: <Icon as={MdHome} width="20px" height="20px" color="inherit" />,
    component: <MainDashboard />,
  },
 {
    name: "Users database",
    layout: '/admin',
    path: '/nft-marketplace',
    icon: (
      <Icon
        as={MdPeople} // or MdPersonOutline for a single user
        width="20px"
        height="20px"
        color="inherit"
      />
    ),
    component: <NFTMarketplace />,
    secondary: true,
},
{
    name: 'Les rendez-vous',
    layout: '/admin',
    icon: <Icon as={MdCalendarToday} width="20px" height="20px" color="inherit" />,
    path: '/data-tables',
    component: <DataTables />,
},
 {
    name: 'Settings',
    layout: '/admin',
    path: '/profile',
    icon: <Icon as={MdSettings} width="20px" height="20px" color="inherit" />,
    component: <Profile />,
},
  {
    name: 'Sign In',
    layout: '/auth',
    path: '/sign-in',
    icon: <Icon as={MdLock} width="20px" height="20px" color="inherit" />,
    component: <SignInCentered />,
  },
 
];

export default routes;
