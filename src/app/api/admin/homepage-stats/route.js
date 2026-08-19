import { GET, POST } from "@/server/controllers/admin/homepage-stats/controller";
import { withAdminRateLimit } from "@/server/middleware/rateLimit";

const rateLimitedPost = withAdminRateLimit(POST);

export { GET, rateLimitedPost as POST };
