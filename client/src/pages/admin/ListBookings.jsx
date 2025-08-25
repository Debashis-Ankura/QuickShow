import React, { useEffect, useState } from 'react';
import Title from '../../components/admin/Title';
import { dateFormat } from '../../lib/dateFormat';
import { useAppContext } from '../../context/AppContext';
import axios from "axios";
import toast from 'react-hot-toast';

const ListBookings = () => {
  const currency = import.meta.env.VITE_CURRENCY;
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const { getToken, user } = useAppContext();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getAllBookings = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("No token available. Make sure you are logged in.");

      const { data } = await axios.get(`${BASE_URL}/api/admin/all-bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!data.success) throw new Error(data.message || "Failed to fetch bookings");

      setBookings(data.bookings || []);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to fetch bookings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) getAllBookings();
  }, [user]);

  if (isLoading) {
    return <p className="text-white mt-6 text-center">Loading bookings...</p>;
  }

  if (bookings.length === 0) {
    return <p className="text-white mt-6 text-center">No bookings found.</p>;
  }

  return (
    <>
      <Title text1="List" text2="Bookings" />
      <div className='max-w-4xl mt-6 overflow-x-auto'>
        <table className='w-full border-collapse rounded-md overflow-hidden text-nowrap'>
          <thead>
            <tr className='bg-primary/20 text-left text-white'>
              <th className='p-2 font-medium pl-5'>User Name</th>
              <th className='p-2 font-medium'>Movie Name</th>
              <th className='p-2 font-medium'>Show Time</th>
              <th className='p-2 font-medium'>Seats</th>
              <th className='p-2 font-medium'>Amount</th>
            </tr>
          </thead>
          <tbody className='text-sm font-light'>
            {bookings.map((item, index) => (
              <tr key={index} className='border-b border-primary/20 bg-primary/5 even:bg-primary/10'>
                <td className='p-2 min-w-45 pl-5'>{item.user?.name || "N/A"}</td>
                <td className='p-2'>{item.show?.movie?.title || "N/A"}</td>
                <td className='p-2'>{item.show?.showDateTime ? dateFormat(item.show.showDateTime) : "N/A"}</td>
                <td>{item.bookedSeats ? Object.keys(item.bookedSeats).map(seat => item.bookedSeats[seat]).join(", ") : "N/A"}</td>
                <td className='p-2'>{currency}{item.amount ?? "0"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default ListBookings;
