import { useState, useEffect } from "react";
import toastError from "../../errors/toastError";
import { format, sub } from 'date-fns'
import api from "../../services/api";

const useTickets = ({
  searchParam,
  tags,
  users,
  pageNumber,
  status,
  date,
  updatedAt,
  showAll,
  queueIds,
  withUnreadMessages,
  whatsappIds,
  statusFilter,
  forceSearch,
  userFilter,
  sortTickets,
  searchOnMessages
}) => {
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchTickets = async () => {
        if (userFilter === undefined || userFilter === null) {
          try {            
            const { data } = await api.get("/tickets", {
              params: {
                searchParam,
                pageNumber,
                tags,
                users,
                status,
                date,
                updatedAt,
                showAll,
                queueIds,
                withUnreadMessages,
                whatsapps: whatsappIds,
                statusFilter,
                sortTickets,
                searchOnMessages
              },
            });
            
            if (isMounted) {
              setTickets(data.tickets);
              setHasMore(data.hasMore);
              setCount(data.count)
              setLoading(false);
            }
          } catch (err) {
            if (isMounted) {
              setLoading(false);
              toastError(err);
            }
          }
        } else {
          try {
            const {data} = await api.get("/dashboard/moments", {
              params: {
                status,
                showAll,
                queueIds,
                dateStart: format(sub(new Date(), { days: 30 }), 'yyyy-MM-dd'),
                dateEnd: format(new Date(), 'yyyy-MM-dd'),
                userId: userFilter
              }
            })

            if (isMounted) {
              const tickets = data.filter(item => item.userId == userFilter);            
              setTickets(tickets);
              setHasMore(null);
              setLoading(false);
            }
          } catch (err) {
            if (isMounted) {
              setLoading(false);
              toastError(err);
            }
          }
        }
      };
    fetchTickets();
    }, 500);
    return () => {
      isMounted = false;
      clearTimeout(delayDebounceFn);
    };
  }, [
    searchParam,
    tags,
    users,
    pageNumber,
    status,
    date,
    updatedAt,
    showAll,
    queueIds,
    withUnreadMessages,
    whatsappIds,
    statusFilter,
    forceSearch,
    sortTickets,
    searchOnMessages
  ]);

  return { tickets, loading, hasMore, count };
};

export default useTickets;
