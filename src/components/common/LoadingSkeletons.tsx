import React from 'react';
import { 
  Box, 
  Paper, 
  Skeleton, 
  Grid, 
  Card, 
  CardContent 
} from '@mui/material';

export const TableSkeleton: React.FC = () => (
  <Paper elevation={2} sx={{ p: 2 }}>
    <Skeleton variant="text" width="30%" height={40} sx={{ mb: 2 }} />
    <Box display="flex" gap={1} mb={2}>
      <Skeleton variant="rectangular" width={120} height={32} />
      <Skeleton variant="rectangular" width={120} height={32} />
    </Box>
    {Array.from({ length: 5 }).map((_, index) => (
      <Box key={index} display="flex" gap={2} mb={1}>
        <Skeleton variant="text" width="25%" />
        <Skeleton variant="text" width="20%" />
        <Skeleton variant="text" width="15%" />
        <Skeleton variant="text" width="15%" />
      </Box>
    ))}
  </Paper>
);

export const ChartSkeleton: React.FC = () => (
  <Paper elevation={2} sx={{ p: 2 }}>
    <Skeleton variant="text" width="40%" height={40} sx={{ mb: 2 }} />
    <Box display="flex" gap={1} mb={2}>
      <Skeleton variant="rectangular" width={100} height={36} />
      <Skeleton variant="rectangular" width={100} height={36} />
      <Skeleton variant="rectangular" width={100} height={36} />
    </Box>
    <Skeleton variant="rectangular" width="100%" height={400} />
  </Paper>
);

export const DashboardSkeleton: React.FC = () => (
  <Box>
    <Skeleton variant="text" width="40%" height={48} sx={{ mb: 3 }} />
    <Grid container spacing={3}>
      {Array.from({ length: 4 }).map((_, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card elevation={2}>
            <CardContent>
              <Skeleton variant="text" width="60%" height={24} />
              <Skeleton variant="text" width="80%" height={40} sx={{ my: 1 }} />
              <Skeleton variant="text" width="40%" height={20} />
            </CardContent>
          </Card>
        </Grid>
      ))}
      <Grid item xs={12}>
        <Card elevation={2}>
          <CardContent>
            <Skeleton variant="text" width="30%" height={28} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" width="100%" height={200} />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </Box>
);

export const FiltersSkeleton: React.FC = () => (
  <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
      <Skeleton variant="text" width="30%" height={32} />
      <Skeleton variant="text" width="20%" height={24} />
    </Box>
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Skeleton variant="rectangular" width="100%" height={40} />
      </Grid>
      <Grid item xs={12} md={3}>
        <Skeleton variant="rectangular" width="100%" height={40} />
      </Grid>
      <Grid item xs={12} md={3}>
        <Skeleton variant="rectangular" width="100%" height={40} />
      </Grid>
    </Grid>
  </Paper>
);
