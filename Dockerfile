FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy csproj and restore dependencies
COPY DashboardAPI/*.csproj ./DashboardAPI/
RUN dotnet restore DashboardAPI/DashboardAPI.csproj

# Copy everything else and build
COPY . ./
RUN dotnet publish DashboardAPI/DashboardAPI.csproj -c Release -o out

# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/out .

# Set environment variables for dynamic port assignment
ENV ASPNETCORE_URLS=http://+:$PORT

# Run the app
ENTRYPOINT ["dotnet", "DashboardAPI.dll"]