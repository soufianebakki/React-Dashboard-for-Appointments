import {
  Box,
  Flex,
  Icon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Text,
  Select,
  Badge,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import React, { useState, useEffect } from "react";
import {
  MdAccessTime,
  MdCheckCircle,
  MdCancel,
} from "react-icons/md";

export default function AppointmentsTable() {
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.300", "gray.600");
  const tableBg = useColorModeValue("white", "gray.800");
  const toast = useToast();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/appointments', {
          headers: {
            'Accept': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          throw new Error(`Expected JSON, got ${contentType}`);
        }
        const data = await response.json();
        setAppointments(data.data || []);
        setLoading(false);
      } catch (err) {
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

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
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
        throw new Error(`Expected JSON, got ${contentType}`);
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update status');
      }

      setAppointments((prev) =>
        prev.map((appt) =>
          appt.id === appointmentId ? { ...appt, statut: newStatus } : appt
        )
      );

      toast({
        title: 'Success',
        description: 'Status updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getStatusProps = (status) => {
    switch (status) {
      case 'en attente':
        return { color: 'orange.500', icon: MdAccessTime, label: 'EN ATT' };
      case 'confirmé':
        return { color: 'green.500', icon: MdCheckCircle, label: 'CONF' };
      case 'annulé':
        return { color: 'red.500', icon: MdCancel, label: 'ANNL' };
      default:
        return { color: 'gray.500', icon: MdAccessTime, label: status };
    }
  };

  return (
    <Box width="100%">
      <Text fontSize='xl' fontWeight='bold' mb='20px' color={textColor}>
        Tableau des rendez-vousz
      </Text>
      {loading ? (
        <Text color={textColor}>Chargement des rendez-vous...</Text>
      ) : error ? (
        <Text color="red.500">{error}</Text>
      ) : (
        <TableContainer width="100%">
          <Table 
            variant='striped' 
            colorScheme='gray' 
            bg={tableBg}
            size="sm"
            tableLayout="fixed"
            width="100%"
          >
            <Thead>
              <Tr>
                <Th px={2} textAlign="center" width="50px">ID</Th>
                <Th px={2} width="120px">NOM COMPLET</Th>
                <Th px={2} width="120px">DATE RDV</Th>
                <Th px={2} textAlign="center" width="80px">CRÉNEAU</Th>
                <Th px={2} textAlign="center" width="120px">TÉLÉPHONE</Th>
                <Th px={2} width="120px">CRÉÉ LE</Th>
                <Th px={2} textAlign="center" width="120px">STATUT</Th>
              </Tr>
            </Thead>
            <Tbody>
              {appointments.length === 0 ? (
                <Tr>
                  <Td colSpan={7} textAlign="center" color={textColor}>
                    Aucun rendez-vous trouvé.
                  </Td>
                </Tr>
              ) : (
                appointments.map((appointment) => {
                  const { color, icon, label } = getStatusProps(appointment.statut);
                  return (
                    <Tr key={appointment.id}>
                      <Td px={2} textAlign="center" width="50px">{appointment.id}</Td>
                      <Td px={2} fontWeight="semibold" width="120px">{appointment.full_name}</Td>
                      <Td px={2} width="120px" whiteSpace="normal">{formatDate(appointment.appointment_date)}</Td>
                      <Td px={2} textAlign="center" width="80px" whiteSpace="normal">{appointment.time_slot}</Td>
                      <Td px={2} textAlign="center" width="120px" whiteSpace="normal">{appointment.phone_number}</Td>
                      <Td px={2} width="120px" whiteSpace="normal">{formatDate(appointment.created_at)}</Td>
                      <Td px={2} width="120px">
                        <Flex align="center" justify="center" gap="8px">
                          <Badge 
                            colorScheme={color.split('.')[0]} 
                            display="flex" 
                            alignItems="center" 
                            gap="4px"
                            px={2}
                            py={1}
                          >
                            <Icon as={icon} w="12px" h="12px" />
                            {label}
                          </Badge>
                          <Select
                            value={appointment.statut}
                            onChange={(e) => handleStatusChange(appointment.id, e.target.value)}
                            size="xs"
                            borderColor={borderColor}
                            width="100px"
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
  );
}