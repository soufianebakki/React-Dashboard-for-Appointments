/*!
  _   _  ___  ____  ___ ________  _   _   _   _ ___   
 | | | |/ _ \|  _ \|_ _|__  / _ \| \ | | | | | |_ _| 
 | |_| | | | | |_) || |  / / | | |  \| | | | | || | 
 |  _  | |_| |  _ < | | / /| |_| | |\  | | |_| || |
 |_| |_|\___/|_| \_\___/____\___/|_| \_|  \___/|___|
                                                                                                                                                                                                                                                                                                                                       
=========================================================
* Horizon UI - v1.1.0
=========================================================

* Product Page: https://www.horizon-ui.com/
* Copyright 2023 Horizon UI (https://www.horizon-ui.com/)

* Designed and Coded by Simmmple

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

// Chakra imports
import {
  Avatar,
  Box,
  Flex,
  FormLabel,
  Icon,
  Select,
  SimpleGrid,
  useColorModeValue,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Text,
  Button,
  useToast,
  Badge,
} from "@chakra-ui/react";
// Assets
import Usa from "assets/img/dashboards/usa.png";
// Custom components
import MiniCalendar from "components/calendar/MiniCalendar";
import MiniStatistics from "components/card/MiniStatistics";
import IconBox from "components/icons/IconBox";
import React, { useState, useEffect } from "react";
import {
  MdAddTask,
  MdAttachMoney,
  MdBarChart,
  MdFileCopy,
  MdCalendarToday,
  MdPerson,
  MdAccessTime,
  MdLocationOn,
  MdDescription,
  MdCheckCircle,
  MdCancel,
} from "react-icons/md";
import CheckTable from "views/admin/default/components/CheckTable";
import ComplexTable from "views/admin/default/components/ComplexTable";
import DailyTraffic from "views/admin/default/components/DailyTraffic";
import PieCard from "views/admin/default/components/PieCard";
import Tasks from "views/admin/default/components/Tasks";
import TotalSpent from "views/admin/default/components/TotalSpent";
import WeeklyRevenue from "views/admin/default/components/WeeklyRevenue";
import {
  columnsDataCheck,
  columnsDataComplex,
} from "views/admin/default/variables/columnsData";
import tableDataCheck from "views/admin/default/variables/tableDataCheck.json";
import tableDataComplex from "views/admin/default/variables/tableDataComplex.json";

export default function UserReports() {
  // Chakra Color Mode
  const brandColor = useColorModeValue("brand.500", "white");
  const boxBg = useColorModeValue("secondaryGray.300", "whiteAlpha.100");
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.300", "gray.600");
  const tableBg = useColorModeValue("white", "gray.800");
  const toast = useToast();

  // State for appointments data
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add these helper functions at the top of your component
  const isSameDay = (date1, date2) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const getWeekRange = () => {
    const today = new Date();
    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(today.getDate() - today.getDay()); // Sunday start
    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6); // Saturday end
    return { start: firstDayOfWeek, end: lastDayOfWeek };
  };

  // Fetch appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/appointments', {
          headers: {
            'Accept': 'application/json',
          },
        });
        console.log('Fetch response status:', response.status);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Non-JSON response:', text);
          throw new Error(`Expected JSON, got ${contentType}`);
        }
        const data = await response.json();
        console.log('Fetch response data:', data);
        setAppointments(data.data || []);
        console.log('Appointments state set:', data.data || []);
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
        setLoading(false);
        toast({
          title: 'Error',
          description: `Failed to fetch appointments data: ${err.message}`,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    fetchAppointments();
  }, [toast]);

  // Format date for display
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Handle status change
  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      console.log(`Updating status for appointment ${appointmentId} to ${newStatus}`);
      const response = await fetch(`http://localhost:5000/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ statut: newStatus }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error(`Expected JSON, got ${contentType}`);
      }

      const data = await response.json();
      console.log('Status update response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update status');
      }

      // Update local state
      setAppointments((prev) =>
        prev.map((appt) =>
          appt.id === appointmentId ? { ...appt, statut: newStatus } : appt
        )
      );
      console.log('Appointments state updated:', appointments);

      toast({
        title: 'Success',
        description: 'Status updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Status Update Error:', error);
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Status colors and icons
  const getStatusProps = (status) => {
    switch (status) {
      case 'en attente':
        return { color: 'orange.500', icon: MdAccessTime, label: 'En attente' };
      case 'confirmé':
        return { color: 'green.500', icon: MdCheckCircle, label: 'Confirmé' };
      case 'annulé':
        return { color: 'red.500', icon: MdCancel, label: 'Annulé' };
      default:
        return { color: 'gray.500', icon: MdAccessTime, label: status };
    }
  };

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <SimpleGrid
        columns={{ base: 1, md: 2, lg: 3, "2xl": 6 }}
        gap='20px'
        mb='20px'>
        
        {/* Daily Appointments - Fixed */}
        <MiniStatistics
          startContent={
            <IconBox
              w='56px'
              h='56px'
              bg={boxBg}
              icon={
                <Icon w='32px' h='32px' as={MdCalendarToday} color={brandColor} />
              }
            />
          }
          name='Daily Appointments'
          value={
            appointments.filter(appointment => {
              try {
                const appointmentDate = new Date(appointment.appointment_date);
                // Reset time components for accurate day comparison
                appointmentDate.setHours(0, 0, 0, 0);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return isSameDay(appointmentDate, today);
              } catch (e) {
                console.error('Invalid date format:', appointment.appointment_date);
                return false;
              }
            }).length
          }
        />

        {/* Weekly Appointments - Fixed */}
        <MiniStatistics
          startContent={
            <IconBox
              w='56px'
              h='56px'
              bg={boxBg}
              icon={
                <Icon w='32px' h='32px' as={MdCalendarToday} color={brandColor} />
              }
            />
          }
          name='Weekly Appointments'
          value={
            appointments.filter(appointment => {
              try {
                const appointmentDate = new Date(appointment.appointment_date);
                const { start, end } = getWeekRange();
                // Reset time components for accurate comparison
                appointmentDate.setHours(0, 0, 0, 0);
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                return appointmentDate >= start && appointmentDate <= end;
              } catch (e) {
                console.error('Invalid date format:', appointment.appointment_date);
                return false;
              }
            }).length
          }
        />

        {/* Monthly Appointments - Fixed */}
        <MiniStatistics
          startContent={
            <IconBox
              w='56px'
              h='56px'
              bg={boxBg}
              icon={
                <Icon w='32px' h='32px' as={MdCalendarToday} color={brandColor} />
              }
            />
          }
          name='Monthly Appointments'
          value={
            appointments.filter(appointment => {
              try {
                const appointmentDate = new Date(appointment.appointment_date);
                const today = new Date();
                return (
                  appointmentDate.getMonth() === today.getMonth() &&
                  appointmentDate.getFullYear() === today.getFullYear()
                );
              } catch (e) {
                console.error('Invalid date format:', appointment.appointment_date);
                return false;
              }
            }).length
          }
        />

        {/* Yearly Appointments - Fixed */}
        <MiniStatistics
          startContent={
            <IconBox
              w='56px'
              h='56px'
              bg={boxBg}
              icon={
                <Icon w='32px' h='32px' as={MdCalendarToday} color={brandColor} />
              }
            />
          }
          name='Yearly Appointments'
          value={
            appointments.filter(appointment => {
              try {
                const appointmentDate = new Date(appointment.appointment_date);
                const today = new Date();
                return appointmentDate.getFullYear() === today.getFullYear();
              } catch (e) {
                console.error('Invalid date format:', appointment.appointment_date);
                return false;
              }
            }).length
          }
        />

        {/* Confirmed Appointments */}
        <MiniStatistics
          name='Confirmed'
          value={appointments.filter(a => a.statut === 'confirmé').length}
          startContent={
            <IconBox
              w='56px'
              h='56px'
              bg={boxBg}
              icon={
                <Icon w='32px' h='32px' as={MdCheckCircle} color='green.500' />
              }
            />
          }
        />

        {/* Cancelled Appointments */}
        <MiniStatistics
          name='Cancelled'
          value={appointments.filter(a => a.statut === 'annulé').length}
          startContent={
            <IconBox
              w='56px'
              h='56px'
              bg={boxBg}
              icon={
                <Icon w='32px' h='32px' as={MdCancel} color='red.500' />
              }
            />
          }
        />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 2, xl: 2 }} gap='20px' mb='20px'>
        <TotalSpent />
        <WeeklyRevenue />
      </SimpleGrid>
      <SimpleGrid columns={{ base: 1, md: 1, xl: 2 }} gap='20px' mb='20px'>
        <CheckTable columnsData={columnsDataCheck} tableData={tableDataCheck} />
        <SimpleGrid columns={{ base: 1, md: 2, xl: 2 }} gap='20px'>
          <DailyTraffic />
          <PieCard />
        </SimpleGrid>
      </SimpleGrid>
      <SimpleGrid columns={{ base: 1, md: 1, xl: 2 }} gap='20px' mb='20px'>
        <ComplexTable
          columnsData={columnsDataComplex}
          tableData={tableDataComplex}
        />
        <SimpleGrid columns={{ base: 1, md: 2, xl: 2 }} gap='20px'>
          <Tasks />
          <MiniCalendar h='100%' minW='100%' selectRange={false} />
        </SimpleGrid>
      </SimpleGrid>

      {/* Appointments Table Section */}
      <Box mb='20px'>
        <Text fontSize='xl' fontWeight='bold' mb='20px' color={textColor}>
          Tableau des rendez-vous
        </Text>
        {loading ? (
          <Text color={textColor}>Loading appointments...</Text>
        ) : error ? (
          <Text color="red.500">{error}</Text>
        ) : (
          <TableContainer>
            <Table variant='striped' colorScheme='gray' bg={tableBg}>
              <Thead>
                <Tr>
                  <Th color={textColor}>ID</Th>
                  <Th color={textColor}>Full Name</Th>
                  <Th color={textColor}>Appointment Date</Th>
                  <Th color={textColor}>Time Slot</Th>
                  <Th color={textColor}>Phone Number</Th>
                  <Th color={textColor}>Created At</Th>
                  <Th color={textColor}>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {appointments.length === 0 ? (
                  <Tr>
                    <Td colSpan={7} textAlign="center" color={textColor}>
                      No appointments found.
                    </Td>
                  </Tr>
                ) : (
                  appointments.map((appointment) => {
                    const { color, icon, label } = getStatusProps(appointment.statut);
                    return (
                      <Tr key={appointment.id}>
                        <Td color={textColor}>{appointment.id}</Td>
                        <Td color={textColor} fontWeight="semibold">{appointment.full_name}</Td>
                        <Td color={textColor}>{formatDate(appointment.appointment_date)}</Td>
                        <Td color={textColor}>{appointment.time_slot}</Td>
                        <Td color={textColor}>{appointment.phone_number}</Td>
                        <Td color={textColor}>{formatDate(appointment.created_at)}</Td>
                        <Td color={textColor}>
                          <Flex align="center" gap="8px">
                            <Badge colorScheme={color.split('.')[0]} display="flex" alignItems="center" gap="4px">
                              <Icon as={icon} w="16px" h="16px" />
                              {label}
                            </Badge>
                            <Select
                              value={appointment.statut}
                              onChange={(e) => handleStatusChange(appointment.id, e.target.value)}
                              size="sm"
                              borderColor={borderColor}
                              width="120px"
                            >
                              <option value="en attente">En attente</option>
                              <option value="confirmé">Confirmé</option>
                              <option value="annulé">Annulé</option>
                            </Select>
                          </Flex>
                        </Td>
                      </Tr>
                    );
                  })
                )}
              </Tbody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
}