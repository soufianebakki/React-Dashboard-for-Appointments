//Users Database
import React, { useState, useEffect } from 'react';
import { useToast } from '@chakra-ui/react';
import {
  Box,
  Button,
  Flex,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  HStack,
} from '@chakra-ui/react';
import { useDisclosure } from '@chakra-ui/react';

export default function Marketplace() {
  // Move all useColorModeValue calls to top level
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const textColorBrand = useColorModeValue('brand.500', 'white');
  const inputBg = useColorModeValue('white', 'gray.800');
  const placeholderColor = useColorModeValue('gray.500', 'gray.400');
  const tableBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.300', 'gray.600');
  const focusBorderColor = textColorBrand;

  const toast = useToast();

  // State
  const [users, setUsers] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', password: '', role: '' });
  const [editData, setEditData] = useState({ id: null, name: '', phone: '', email: '', password: '', role: '' });

  // Modal controls
  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:5000/api/users', {
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
          console.error('Non-JSON response:', text);
          throw new Error(`Expected JSON, got ${contentType}`);
        }

        const data = await response.json();
        setUsers(data.users || []);
      } catch (error) {
        console.error('Fetch Error:', error);
        toast({
          title: 'Error',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [toast]);

  // Handle form input changes (add user)
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle edit input changes
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle add user submission
  const handleSubmit = async () => {
    try {
      if (!formData.name || !formData.phone || !formData.email || !formData.password || !formData.role) {
        throw new Error('Please fill all fields');
      }

      console.log('Submitting new user:', formData);
      const response = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error(`Expected JSON, got ${contentType}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      toast({
        title: 'Success',
        description: `User created with ID: ${data.userId}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Refresh user list
      const updatedResponse = await fetch('http://localhost:5000/api/users', {
        headers: {
          'Accept': 'application/json',
        },
      });
      const updatedData = await updatedResponse.json();
      setUsers(updatedData.users || []);

      onAddClose();
      setFormData({ name: '', phone: '', email: '', password: '', role: '' });
    } catch (error) {
      console.error('Submit Error:', error);
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle user deletion
  const handleDelete = async (userId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this user?');
    if (!confirmDelete) return;

    setDeletingId(userId);

    try {
      console.log('Deleting user with ID:', userId);
      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response from DELETE:', text);
        throw new Error(`Expected JSON, got ${contentType}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Delete failed');
      }

      setUsers((prev) => prev.filter((user) => user.id !== userId));

      toast({
        title: 'Success',
        description: data.message || 'User deleted successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Delete Error:', error);
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Handle user modification
  const handleEdit = (user) => {
    console.log('Editing user:', user);
    setEditData({ id: user.id, name: user.name, phone: user.phone, email: user.email, password: '', role: '' });
    onEditOpen();
  };

  const handleEditSubmit = async () => {
    try {
      if (!editData.name || !editData.phone || !editData.email) {
        throw new Error('Please fill all required fields (name, phone, email)');
      }

      console.log('Submitting edited user:', editData);
      const response = await fetch(`http://localhost:5000/api/users/${editData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: editData.name,
          phone: editData.phone,
          email: editData.email,
          password: editData.password || undefined,
          role: editData.role || undefined,
        }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error(`Expected JSON, got ${contentType}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Update failed');
      }

      toast({
        title: 'Success',
        description: `User updated successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Refresh user list
      const updatedResponse = await fetch('http://localhost:5000/api/users', {
        headers: {
          'Accept': 'application/json',
        },
      });
      const updatedData = await updatedResponse.json();
      setUsers(updatedData.users || []);

      onEditClose();
      setEditData({ id: null, name: '', phone: '', email: '', password: '', role: '' });
    } catch (error) {
      console.error('Edit Error:', error);
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Dashboard Interface
  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
      <Flex direction="column" gap="20px">
        <Flex justifyContent="flex-end">
          <Button colorScheme="brand" onClick={onAddOpen} _hover={{ bg: textColorBrand }}>
            Add User
          </Button>
        </Flex>

        {/* Users Table */}
        <Table variant="striped" colorScheme="teal" size="md" bg={tableBg}>
          <Thead>
            <Tr>
              <Th color={textColor}>Name</Th>
              <Th color={textColor}>Phone</Th>
              <Th color={textColor}>Email</Th>
              <Th color={textColor}>Role</Th>
              <Th color={textColor} textAlign="center">
                Actions
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {loading ? (
              <Tr>
                <Td colSpan={5} textAlign="center" color={textColor}>
                  Loading users...
                </Td>
              </Tr>
            ) : users.length === 0 ? (
              <Tr>
                <Td colSpan={5} textAlign="center" color={textColor}>
                  No users found. Click "Add User" to create one.
                </Td>
              </Tr>
            ) : (
              users.map((user) => (
                <Tr key={user.id}>
                  <Td color={textColor}>{user.name}</Td>
                  <Td color={textColor}>{user.phone}</Td>
                  <Td color={textColor}>{user.email}</Td>
                  <Td color={textColor}>{user.role}</Td>
                  <Td>
                    <HStack spacing="2" justify="center">
                      {user.email !== 'superadmin@gmail.com' && user.role !== 'superadmin' ? (
                        <Button
                          colorScheme="red"
                          size="sm"
                          onClick={() => handleDelete(user.id)}
                          isLoading={deletingId === user.id}
                          loadingText="Deleting"
                        >
                          Delete
                        </Button>
                      ) : (
                        <Text fontSize="sm" color={textColor}>Protected</Text>
                      )}
                      <Button
                        colorScheme="blue"
                        size="sm"
                        onClick={() => handleEdit(user)}
                      >
                        Modify
                      </Button>
                    </HStack>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Flex>

      {/* Add User Modal */}
      <Modal isOpen={isAddOpen} onClose={onAddClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New User</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel color={textColor}>Name</FormLabel>
              <Input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="John Doe"
                color={textColor}
                bg={inputBg}
                _placeholder={{ color: placeholderColor }}
                borderColor={borderColor}
                _focus={{ borderColor: focusBorderColor, boxShadow: `0 0 0 1px ${focusBorderColor}` }}
              />
            </FormControl>
            <FormControl mt={4}>
              <FormLabel color={textColor}>Phone</FormLabel>
              <Input
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+1234567890"
                color={textColor}
                bg={inputBg}
                _placeholder={{ color: placeholderColor }}
                borderColor={borderColor}
                _focus={{ borderColor: focusBorderColor, boxShadow: `0 0 0 1px ${focusBorderColor}` }}
              />
            </FormControl>
            <FormControl mt={4}>
              <FormLabel color={textColor}>Email</FormLabel>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="user@example.com"
                color={textColor}
                bg={inputBg}
                _placeholder={{ color: placeholderColor }}
                borderColor={borderColor}
                _focus={{ borderColor: focusBorderColor, boxShadow: `0 0 0 1px ${focusBorderColor}` }}
              />
            </FormControl>
            <FormControl mt={4}>
              <FormLabel color={textColor}>Password</FormLabel>
              <Input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter password"
                color={textColor}
                bg={inputBg}
                _placeholder={{ color: placeholderColor }}
                borderColor={borderColor}
                _focus={{ borderColor: focusBorderColor, boxShadow: `0 0 0 1px ${focusBorderColor}` }}
              />
            </FormControl>
            <FormControl mt={4}>
              <FormLabel color={textColor}>Role</FormLabel>
              <Select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                placeholder="Select role"
                color={textColor}
                bg={inputBg}
                borderColor={borderColor}
                _focus={{ borderColor: focusBorderColor, boxShadow: `0 0 0 1px ${focusBorderColor}` }}
              >
                <option value="admin">Admin</option>
                <option value="assistante">Assistante</option>
              </Select>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="brand" mr={3} onClick={handleSubmit}>
              Add
            </Button>
            <Button onClick={onAddClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit User</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel color={textColor}>Name</FormLabel>
              <Input
                name="name"
                value={editData.name}
                onChange={handleEditInputChange}
                placeholder="John Doe"
                color={textColor}
                bg={inputBg}
                _placeholder={{ color: placeholderColor }}
                borderColor={borderColor}
                _focus={{ borderColor: focusBorderColor, boxShadow: `0 0 0 1px ${focusBorderColor}` }}
              />
            </FormControl>
            <FormControl mt={4}>
              <FormLabel color={textColor}>Phone</FormLabel>
              <Input
                name="phone"
                value={editData.phone}
                onChange={handleEditInputChange}
                placeholder="+1234567890"
                color={textColor}
                bg={inputBg}
                _placeholder={{ color: placeholderColor }}
                borderColor={borderColor}
                _focus={{ borderColor: focusBorderColor, boxShadow: `0 0 0 1px ${focusBorderColor}` }}
              />
            </FormControl>
            <FormControl mt={4}>
              <FormLabel color={textColor}>Email</FormLabel>
              <Input
                name="email"
                type="email"
                value={editData.email}
                onChange={handleEditInputChange}
                placeholder="user@example.com"
                color={textColor}
                bg={inputBg}
                _placeholder={{ color: placeholderColor }}
                borderColor={borderColor}
                _focus={{ borderColor: focusBorderColor, boxShadow: `0 0 0 1px ${focusBorderColor}` }}
              />
            </FormControl>
            <FormControl mt={4}>
              <FormLabel color={textColor}>Password</FormLabel>
              <Input
                name="password"
                type="password"
                value={editData.password}
                onChange={handleEditInputChange}
                placeholder="Enter new password (optional)"
                color={textColor}
                bg={inputBg}
                _placeholder={{ color: placeholderColor }}
                borderColor={borderColor}
                _focus={{ borderColor: focusBorderColor, boxShadow: `0 0 0 1px ${focusBorderColor}` }}
              />
            </FormControl>
            <FormControl mt={4}>
              <FormLabel color={textColor}>Role</FormLabel>
              <Select
                name="role"
                value={editData.role}
                onChange={handleEditInputChange}
                placeholder="Select role (optional)"
                color={textColor}
                bg={inputBg}
                borderColor={borderColor}
                _focus={{ borderColor: focusBorderColor, boxShadow: `0 0 0 1px ${focusBorderColor}` }}
              >
                <option value="admin">Admin</option>
                <option value="assistante">Assistante</option>
              </Select>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="brand" mr={3} onClick={handleEditSubmit}>
              Save
            </Button>
            <Button onClick={onEditClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}