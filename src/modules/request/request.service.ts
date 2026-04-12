import { computeSkip, computeTotalPages } from "@/utils/pagination.utils";
import type { ListMyRequestsQueryInput } from "@/modules/request/request.validation";
import * as requestRepository from "@/modules/request/request.repository";
import { mapBookingToRequestListItem } from "@/modules/request/request.mapper";

export const listMyParcelRequests = async (senderId: string, query: ListMyRequestsQueryInput) => {
  const limit = query.limit;
  const page = query.page;
  const skip = computeSkip(page, limit);
  const sortDir = query.sort === "asc" ? 1 : -1;

  const [rows, total] = await Promise.all([
    requestRepository.findSenderBookingsForRequestList(
      senderId,
      query.status,
      skip,
      limit,
      sortDir
    ),
    requestRepository.countSenderBookingsForRequestList(senderId, query.status),
  ]);

  const data = rows.map((row) => mapBookingToRequestListItem(row));
  const totalPages = computeTotalPages(total, limit);

  return {
    data,
    pagination: { page, limit, total, totalPages },
  };
};
