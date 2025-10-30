import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  useMediaQuery,
  Tabs,
  Tab,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Button,
  TextField,
} from "@mui/material";
import { Person as PersonIcon, Article as ArticleIcon } from "@mui/icons-material";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "scenes/navbar";
import Footer from "components/Footer";
import FlexBetween from "components/FlexBetween";
import UserImage from "components/UserImage";
import AdminBadge from "components/AdminBadge";
import Friend from "components/Friend";

const SearchPage = () => {
  const [searchType, setSearchType] = useState("users");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);

  const isNonMobileScreens = useMediaQuery("(min-width:1000px)");
  const token = useSelector((state) => state.token);
  const location = useLocation();
  const navigate = useNavigate();

  // Get search query from URL parameters
  const queryParams = new URLSearchParams(location.search);
  const query = queryParams.get("q") || "";

  const performSearch = useCallback(async (searchQuery, type) => {
    if (!searchQuery.trim() || searchQuery.length < 2) return;

    setLoading(true);
    try {
      let endpoint = "";
      let params = new URLSearchParams({
        query: searchQuery.trim(),
        limit: "20",
        page: "1"
      });

      if (type === "users") {
        endpoint = `https://mockingbird-backend.idrees.inusers/search?${params}`;
      } else if (type === "posts") {
        params.append("type", "all");
        endpoint = `https://mockingbird-backend.idrees.inposts/search?${params}`;
      }

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();

      if (type === "users") {
        setResults(data.users || []);
        setPagination(data.pagination);
      } else {
        setResults(data.posts || []);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleFriendAction = (action, friendId) => {
    // Update the local state to reflect the change
    setResults(prevResults => 
      prevResults.map(result => 
        result._id === friendId 
          ? { ...result, isFriend: action === 'request_sent' ? "pending" : action === 'friends' ? true : false }
          : result
      )
    );
  };

  useEffect(() => {
    if (query.trim().length >= 2) {
      performSearch(query, searchType);
    }
  }, [query, searchType, performSearch]);

  const handleTypeChange = (event, newValue) => {
    setSearchType(newValue);
  };

  const handleLoadMore = async () => {
    if (!pagination?.hasNextPage) return;

    const nextPage = pagination.currentPage + 1;
    const searchQuery = query;

    try {
      let endpoint = "";
      let params = new URLSearchParams({
        query: searchQuery.trim(),
        limit: "20",
        page: nextPage.toString()
      });

      if (searchType === "users") {
        endpoint = `https://mockingbird-backend.idrees.inusers/search?${params}`;
      } else if (searchType === "posts") {
        params.append("type", "all");
        endpoint = `https://mockingbird-backend.idrees.inposts/search?${params}`;
      }

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Load more failed");
      }

      const data = await response.json();

      if (searchType === "users") {
        setResults(prev => [...prev, ...(data.users || [])]);
        setPagination(data.pagination);
      } else {
        setResults(prev => [...prev, ...(data.posts || [])]);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Load more error:", error);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar />
      <Box
        width="100%"
        sx={{ p: { xs: '1rem', md: '2rem 6%' }, backgroundColor: 'transparent' }}
        flex={1}
      >
        {/* Search Header */}
        <Box mb={3}>
          <Typography variant="h5" fontWeight="bold" mb={1}>
            Search
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search..."
              defaultValue={query}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = e.currentTarget.value.trim();
                  if (val.length >= 2) {
                    navigate(`/search?q=${encodeURIComponent(val)}&type=${searchType}`);
                  }
                }
              }}
            />
            <Button
              variant="contained"
              onClick={(e) => {
                const input = e.currentTarget.parentElement.querySelector('input');
                if (input) {
                  const val = input.value.trim();
                  if (val.length >= 2) {
                    navigate(`/search?q=${encodeURIComponent(val)}&type=${searchType}`);
                  }
                }
              }}
            >
              Go
            </Button>
          </Box>
          {query && (
            <Typography variant="body2" color="text.secondary" mt={1}>
              Results for "{query}"
            </Typography>
          )}
        </Box>

        {/* Search Type Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={searchType}
            onChange={(event, newValue) => {
              setSearchType(newValue);
              if (query.trim().length >= 2) {
                navigate(`/search?q=${encodeURIComponent(query)}&type=${newValue}`);
              }
            }}
            variant={isNonMobileScreens ? "standard" : "fullWidth"}
          >
            <Tab
              value="users"
              label="Users"
              icon={<PersonIcon />}
              iconPosition="start"
            />
            <Tab
              value="posts"
              label="Posts"
              icon={<ArticleIcon />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* Search Results */}
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress size={40} />
            <Typography variant="body1" ml={2}>
              Searching...
            </Typography>
          </Box>
        ) : results.length === 0 && query.length >= 2 ? (
          <Box textAlign="center" py={8}>
            <Typography variant="h6" color="text.secondary">
              No {searchType} found for "{query}"
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{
              backgroundColor: (theme) => theme.palette.background.paper,
              borderRadius: 2,
              p: 2,
              border: '1px solid',
              borderColor: 'divider'
            }}>
            <Grid container spacing={{ xs: 1.5, md: 2 }}>
              {results.map((result, index) => (
                <Grid item xs={12} sm={6} md={4} key={result._id || index}>
                  <Card
                    sx={{
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      bgcolor: 'transparent',
                      boxShadow: 'none',
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 'none',
                      },
                    }}
                    onClick={() => {
                      if (searchType === "users") {
                        navigate(`/profile/${result._id}`);
                      }
                    }}
                  >
                    <CardContent>
                      {searchType === "users" ? (
                        // User Result
                        <Box textAlign="center">
                          <UserImage
                            image={result.picturePath}
                            size="80px"
                            name={`${result.firstName} ${result.lastName}`}
                          />
                          <Typography variant="h6" fontWeight="bold" mt={2}>
                            {result.firstName} {result.lastName}
                            {result.isAdmin && <AdminBadge size="small" />}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" mt={1}>
                            {result.bio || result.location || "No bio"}
                          </Typography>
                          <Box mt={2}>
                            <Friend
                              friendId={result._id}
                              name={`${result.firstName} ${result.lastName}`}
                              subtitle={result.bio ? (result.bio.length > 100 ? `${result.bio.substring(0, 100)}...` : result.bio) : "No bio"}
                              userPicturePath={result.picturePath}
                              friendStatus={
                                result.isFriend === true ? 'friends' :
                                result.isFriend === "pending" ? 'request_sent' :
                                'none'
                              }
                              onFriendAction={handleFriendAction}
                              showAddFriend={true}
                            />
                          </Box>
                        </Box>
                      ) : (
                        // Post Result
                        <Box>
                          <FlexBetween mb={2}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <UserImage
                                image={result.userId?.picturePath || result.userPicturePath}
                                size="32px"
                                name={`${result.firstName} ${result.lastName}`}
                              />
                              <Box>
                                <Typography variant="subtitle2" fontWeight="bold">
                                  {result.firstName} {result.lastName}
                                  {(result.userId?.isAdmin || result.isAdmin) && <AdminBadge size="small" />}
                                </Typography>
                              </Box>
                            </Box>
                            <Chip
                              label={result.searchMatch?.type || "post"}
                              size="small"
                              variant="outlined"
                            />
                          </FlexBetween>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical",
                              lineHeight: 1.4,
                            }}
                          >
                            {result.searchMatch?.text || result.description || "Post content"}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            </Box>

            {/* Load More Button */}
            {pagination?.hasNextPage && (
              <Box textAlign="center" mt={4}>
                <Button
                  variant="outlined"
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={20} /> : "Load More"}
                </Button>
              </Box>
            )}
          </>
        )}
      </Box>
      <Footer />
    </Box>
  );
};

export default SearchPage;
