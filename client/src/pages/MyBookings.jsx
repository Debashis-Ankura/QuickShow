import React, { useEffect, useState } from 'react'
import Loading from '../components/Loading'
import BlurCircle from '../components/BlurCircle'
import timeFormat from '../lib/timeFormat'
import { dateFormat } from '../lib/dateFormat'
import axios from "axios"
import { useAppContext } from '../context/AppContext'

const MyBookings = () => {
  const currency = import.meta.env.VITE_CURRENCY
  const { getToken, user, image_base_url } = useAppContext()
  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPolling, setIsPolling] = useState(false)
  const [pollingMessage, setPollingMessage] = useState('')

  // Fetch user bookings
  const getMyBookings = async () => {
    try {
      const { data } = await axios.get('/api/user/bookings', {
        headers: { Authorization: `Bearer ${await getToken()}` }
      })
      if (data.success) {
        setBookings(data.bookings)
      }
    } catch (error) {
      console.log("Error fetching bookings:", error)
    }
    setIsLoading(false)
  }

  // Poll booking status from backend
  const pollBookingStatus = async (bookingId) => {
  setIsPolling(true);
  setPollingMessage('Verifying payment...');

  console.log("🔁 Starting polling for booking ID:", bookingId);

  try {
    for (let i = 0; i < 5; i++) {
      try {
        const { data } = await axios.get(`/api/booking/${bookingId}`, {
          headers: { Authorization: `Bearer ${await getToken()}` }
        });

        console.log(`⏳ Poll attempt ${i + 1}:`, data.booking);

        if (data.booking?.isPaid) {
          console.log("✅ Booking marked as paid on server!");
          setPollingMessage('Payment confirmed! Refreshing bookings...');

          // 🧠 Clear and refresh bookings
          setBookings((prev) => {
            const updated = prev.map((b) =>
              b._id === bookingId ? { ...b, isPaid: true, paymentLink: '' } : b
            );
            return updated;
          });

          return;
        }
      } catch (error) {
        console.error(`❌ Polling error (attempt ${i + 1}):`, error);
      }

      await new Promise((res) => setTimeout(res, 2000));
    }

    setPollingMessage('Could not confirm payment yet. Please refresh later.');
  } finally {
    setIsPolling(false);
  }
};



  // Redirect to backend payment link
  const handlePayNow = (paymentLink) => {
    if (paymentLink) {
      window.location.href = paymentLink
    }
  }

  // Extract bookingId from URL query param
  useEffect(() => {
    if (!user) return

    getMyBookings()

    const urlParams = new URLSearchParams(window.location.search)
    const bookingId = urlParams.get('bookingId')

    if (bookingId) {
      pollBookingStatus(bookingId)
      // Clean URL so bookingId param disappears after polling
      window.history.replaceState(null, '', window.location.pathname)
    }

    // Also re-fetch bookings once after 5s just in case webhook delayed
    const timer = setTimeout(() => getMyBookings(), 5000)
    return () => clearTimeout(timer)
  }, [user])

  if (isLoading) return <Loading />

  return (
    <div className="relative px-6 md:px-16 lg:px-40 pt-30 md:pt-40 min-h-[80vh]">
      <BlurCircle top="100px" left="100px" />
      <BlurCircle bottom="0px" left="600px" />

      <h1 className="text-lg font-semibold mb-4">My Bookings</h1>

      {isPolling && (
        <p className="mb-4 text-blue-600 font-semibold">{pollingMessage}</p>
      )}

      {bookings.length > 0 ? (
        bookings.map((item, index) => (
          <div
            key={index}
            className="flex flex-col md:flex-row justify-between bg-primary/8 border border-primary/20 rounded-lg mt-4 p-2 max-w-3xl"
          >
            {/* Movie info */}
            <div className="flex flex-col md:flex-row">
              <img
                src={image_base_url + item.show.movie.poster_path}
                alt={item.show.movie.title}
                className="md:max-w-45 aspect-video h-auto object-cover object-bottom rounded"
              />
              <div className="flex flex-col p-4">
                <p className="text-lg font-semibold">{item.show.movie.title}</p>
                <p className="text-gray-400 text-sm">
                  {timeFormat(item.show.movie.runtime)}
                </p>
                <p className="text-gray-400">
                  {dateFormat(item.show.showDateTime)}
                </p>
              </div>
            </div>

            {/* Payment & seat info */}
            <div className="flex flex-col md:items-end md:text-right justify-between p-4">
              <div className="flex items-center gap-4">
                <p className="text-2xl font-semibold mb-3">
                  {currency}{item.amount}
                </p>
                {!item.isPaid && item.paymentLink && (
                  <button
                    onClick={() => handlePayNow(item.paymentLink)}
                    className="bg-primary px-4 py-1.5 mb-3 text-sm rounded-full font-medium cursor-pointer hover:bg-primary-dull transition"
                  >
                    Pay Now
                  </button>
                )}
              </div>
              <div className="text-sm">
                <p>
                  <span className="text-gray-400">Total Tickets: </span>
                  {item.bookedSeats.length}
                </p>
                <p>
                  <span className="text-gray-400">Seat Number: </span>
                  {item.bookedSeats.join(', ')}
                </p>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="flex flex-col items-center justify-center h-64">
          <h2 className="text-2xl font-bold text-center">No Bookings Found</h2>
        </div>
      )}
    </div>
  )
}

export default MyBookings
