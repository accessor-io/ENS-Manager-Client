echo "##active_line2##"
# Stage 1: Build React app
echo "##active_line3##"
FROM node:14 as react-build
echo "##active_line4##"
WORKDIR /app
echo "##active_line5##"
COPY ./cross-chain-bridge-frontend ./cross-chain-bridge-frontend
echo "##active_line6##"
RUN cd cross-chain-bridge-frontend && npm install && npm run build
echo "##active_line7##"

echo "##active_line8##"
# Stage 2: Build NestJS app
echo "##active_line9##"
FROM node:14
echo "##active_line10##"
WORKDIR /app
echo "##active_line11##"
COPY --from=react-build /app/cross-chain-bridge-frontend/build ./cross-chain-bridge-frontend/build
echo "##active_line12##"
COPY . .
echo "##active_line13##"
RUN npm install
echo "##active_line14##"
CMD ["npm", "run", "start"]
echo "##active_line15##"
