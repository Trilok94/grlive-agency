import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { 
  FaDownload, 
  FaSpinner, 
  FaChartPie, 
  FaCalendarAlt, 
  FaFilter, 
  FaMoneyBillWave,
  FaUsers,
  FaBuilding,
  FaHandHoldingUsd,
  FaArrowUp,
  FaExchangeAlt,
  FaChartLine,
  FaFilePdf,
  FaBankNote,
  FaUniversity,
  FaTimes,
  FaExclamationTriangle
} from 'react-icons/fa';
import Parse from 'parse';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from 'react-toastify';
import { CSVLink } from 'react-csv';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import Transaction from '../../models/Transaction';
import AgentStats from '../../models/AgentStats';
import { diamondsToUsd, formatUsd, convertDiamondsToUsdFormat } from '../../utils/helpers';
import ConfigService from '../../services/ConfigService';
import User from '../../models/User';
import Agent from '../../models/Agent';
import PayoutMethod from '../../models/PayoutMethod';

// Styled Components
const Container = styled.div`
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    padding: 1rem 0.75rem;
  }
`;

const PageTitle = styled.h1`
  margin-bottom: 2rem;
  font-size: 1.8rem;
  color: #333;
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 0.75rem;
    color: #4776E6;
  }
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
  }
`;

const FiltersContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  align-items: center;
  
  @media (max-width: 768px) {
    padding: 1rem;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    flex-direction: column;
    align-items: stretch;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 200px;
  
  label {
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
    color: #4a5568;
    font-weight: 500;
  }
  
  select, input {
    padding: 0.5rem;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    font-size: 0.875rem;
  }
  
  @media (max-width: 768px) {
    min-width: 100%;
    margin-bottom: 0.5rem;
    
    select, input {
      padding: 0.75rem;
      font-size: 1rem;
      height: 44px;
    }
    
    label {
      font-size: 0.9rem;
    }
  }
`;

const FilterButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #4776E6;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-weight: 500;
  cursor: pointer;
  height: 38px;
  margin-top: auto;
  
  &:hover {
    background-color: #3a63c2;
  }
  
  svg {
    margin-right: 0.5rem;
  }
  
  &:disabled {
    background-color: #a0aec0;
    cursor: not-allowed;
  }
  
  @media (max-width: 768px) {
    height: 44px;
    padding: 0.75rem 1.25rem;
    font-size: 1rem;
    width: 100%;
    margin-top: 0.5rem;
    touch-action: manipulation;
  }
`;

const ExportButton = styled(FilterButton)`
  background-color: #38a169;
  
  &:hover {
    background-color: #2f855a;
  }
  
  a {
    color: white;
    text-decoration: none;
    display: flex;
    align-items: center;
    width: 100%;
    justify-content: center;
  }
`;

const PdfExportButton = styled(FilterButton)`
  background-color: #e53e3e;
  
  &:hover {
    background-color: #c53030;
  }
  
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    margin-right: 0.5rem;
  }
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const WithdrawButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1.5rem;
  
  @media (max-width: 768px) {
    justify-content: center;
    margin-bottom: 1rem;
  }
`;

// Modal Components
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
`;

const WithdrawModal = styled.div`
  background-color: white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  animation: slideIn 0.3s ease;
  
  @keyframes slideIn {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  @media (max-width: 768px) {
    max-width: 90%;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  
  h2 {
    margin: 0;
    font-size: 1.5rem;
    color: #2d3748;
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
  overflow-y: auto;
  
  .subtitle {
    color: #4a5568;
    margin-bottom: 1.5rem;
    font-size: 1rem;
  }
  
  input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 1rem;
    transition: all 0.3s ease;
    
    &:focus {
      border-color: #4776E6;
      outline: none;
    }
    
    &::placeholder {
      color: #a0aec0;
    }
    
    &:disabled {
      background-color: #f7fafc;
      cursor: not-allowed;
    }
    
    &.error {
      border-color: #e53e3e;
      background-color: rgba(229, 62, 62, 0.05);
      color: #e53e3e;
      animation: shake 0.5s linear;
    }
    
    @keyframes shake {
      0% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      50% { transform: translateX(5px); }
      75% { transform: translateX(-5px); }
      100% { transform: translateX(0); }
    }
  }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  background-color: #f7fafc;
  border-top: 1px solid #e2e8f0;
  border-radius: 0 0 12px 12px;
  
  @media (max-width: 768px) {
    flex-direction: column-reverse;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #718096;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 50%;
  transition: background-color 0.3s ease;
  
  &:hover {
    background-color: #f7fafc;
    color: #4a5568;
  }
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 1.5rem;
  
  label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #4a5568;
    margin-bottom: 0.5rem;
  }
`;

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  color: #e53e3e;
  background-color: rgba(229, 62, 62, 0.1);
  padding: 0.5rem;
  border-radius: 4px;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  
  .icon {
    margin-right: 0.5rem;
    flex-shrink: 0;
  }
`;

const ConversionInfo = styled.div`
  background-color: #f7fafc;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  transition: all 0.3s ease;
  
  &.error {
    background-color: rgba(229, 62, 62, 0.1);
    border-left: 3px solid #e53e3e;
  }
`;

const ConversionDetail = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  &.total {
    margin-top: 0.75rem;
    margin-bottom: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px dashed #e2e8f0;
    font-weight: 600;
    
    .label, .value {
      font-size: 1rem;
      color: #2d3748;
    }
  }
  
  .label {
    font-size: 0.875rem;
    color: #4a5568;
  }
  
  .value {
    font-weight: 500;
    color: #2d3748;
  }
`;

const BalanceInfo = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 0.75rem 1rem;
  background-color: #ebf4ff;
  border-radius: 8px;
  border-left: 4px solid #4776E6;
  
  .label {
    font-size: 0.875rem;
    color: #4a5568;
    margin-right: 0.5rem;
  }
  
  .value {
    font-weight: 600;
    color: #2d3748;
    margin-right: 0.5rem;
  }
  
  .usd-value {
    font-size: 0.75rem;
    color: #718096;
  }
`;

const WithdrawInfo = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: #f7fafc;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  border-left: 4px solid #3b7b59;
  
  .icon {
    color: #3b7b59;
    font-size: 1.25rem;
    margin-right: 0.75rem;
  }
  
  span {
    font-size: 0.875rem;
    color: #4a5568;
  }
`;

const NoPaymentMethodLink = styled.a`
  color: #3b7b59;
  text-decoration: underline;
  cursor: pointer;
  font-weight: 500;
  margin-left: 0.5rem;
  
  &:hover {
    color: #2d5d43;
  }
`;

const LimitsInfo = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #718096;
  
  .limit {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  
  .limit-label {
    font-weight: 500;
  }
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
  
  .spinner {
    animation: spin 1s linear infinite;
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  }
`;

const CancelButton = styled(Button)`
  background-color: white;
  color: #4a5568;
  border: 1px solid #e2e8f0;
  
  &:hover:not(:disabled) {
    background-color: #f7fafc;
  }
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const SubmitButton = styled(Button)`
  background-color: #3b7b59;
  color: white;
  border: none;
  
  &:hover:not(:disabled) {
    background-color: #2d5d43;
  }
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const WithdrawButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #3b7b59;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  font-size: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    background-color: #2d5d43;
    transform: translateY(-2px);
    box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
  }
  
  svg {
    margin-right: 0.75rem;
    font-size: 1.2rem;
  }
  
  @media (max-width: 768px) {
    width: 100%;
    padding: 1rem;
  }
`;

const ReportCard = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
  overflow: hidden;
  
  @media (max-width: 768px) {
    border-radius: 8px;
    margin-bottom: 1.5rem;
  }
`;

const ReportHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  
  h2 {
    font-size: 1.25rem;
    margin: 0;
    color: #2d3748;
    display: flex;
    align-items: center;
  }
  
  svg {
    margin-right: 0.75rem;
    color: #4776E6;
  }
  
  @media (max-width: 768px) {
    padding: 1.25rem 1rem;
    
    h2 {
      font-size: 1.1rem;
    }
    
    svg {
      margin-right: 0.5rem;
    }
  }
`;

const ReportContent = styled.div`
  padding: 1.5rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const ModernStatsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-bottom: 2rem;
`;

const MainRevenueCards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const MainRevenueCard = styled.div`
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  }
  
  @media (max-width: 768px) {
    border-radius: 10px;
    
    &:hover {
      transform: translateY(-3px);
    }
  }
`;

const RevenueCardHeader = styled.div`
  background: linear-gradient(135deg, ${props => props.$color}40 0%, ${props => props.$color} 100%);
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  
  .icon-container {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    
    .icon {
      font-size: 1.5rem;
      color: ${props => props.$color};
    }
  }
  
  .title {
    color: white;
    font-size: 1.2rem;
    font-weight: 600;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  @media (max-width: 768px) {
    padding: 1.25rem;
    
    .icon-container {
      width: 40px;
      height: 40px;
      
      .icon {
        font-size: 1.25rem;
      }
    }
    
    .title {
      font-size: 1rem;
    }
  }
`;

const RevenueCardContent = styled.div`
  padding: 1.5rem;
  
  .amount {
    font-size: 2rem;
    font-weight: 700;
    color: #333;
    margin-bottom: 0.5rem;
  }
  
  .points {
    color: #666;
    font-size: 1rem;
  }
  
  @media (max-width: 768px) {
    padding: 1.25rem;
    
    .amount {
      font-size: 1.75rem;
    }
    
    .points {
      font-size: 0.9rem;
    }
  }
`;

const TransactionTypeCards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
`;

const TransactionTypeCard = styled.div`
  display: flex;
  align-items: center;
  background: white;
  border-radius: 10px;
  padding: 1rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease;
  
  &:hover {
    transform: translateY(-3px);
  }
  
  @media (max-width: 768px) {
    padding: 0.875rem;
    border-radius: 8px;
    
    &:hover {
      transform: translateY(-2px);
    }
  }
`;

const TransactionTypeIcon = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 10px;
  background-color: ${props => props.$bgColor};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  flex-shrink: 0;
  
  svg {
    font-size: 1.5rem;
    color: ${props => props.$iconColor};
  }
  
  @media (max-width: 768px) {
    width: 42px;
    height: 42px;
    border-radius: 8px;
    margin-right: 0.75rem;
    
    svg {
      font-size: 1.25rem;
    }
  }
`;

const TransactionTypeDetails = styled.div`
  flex: 1;
  
  .type-name {
    font-weight: 600;
    color: #333;
    margin-bottom: 0.25rem;
  }
  
  .type-amount {
    font-size: 1.25rem;
    font-weight: 700;
    color: #333;
    margin-bottom: 0.25rem;
  }
  
  .type-points {
    font-size: 0.875rem;
    color: #666;
  }
  
  @media (max-width: 768px) {
    .type-name {
      font-size: 0.9rem;
    }
    
    .type-amount {
      font-size: 1.1rem;
    }
    
    .type-points {
      font-size: 0.8rem;
    }
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  }
`;

const StatCard = styled.div`
  background-color: ${props => props.$bgColor || '#f7fafc'};
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  .title {
    color: #4a5568;
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
  }
  
  .value {
    font-size: 1.5rem;
    font-weight: bold;
    color: ${props => props.$valueColor || '#2d3748'};
  }
  
  .subtitle {
    font-size: 0.75rem;
    color: #718096;
    margin-top: 0.25rem;
  }
  
  svg {
    margin-right: 0.5rem;
    color: ${props => props.$iconColor || '#4776E6'};
  }
  
  @media (max-width: 768px) {
    padding: 1.25rem;
    
    .title {
      font-size: 0.8rem;
    }
    
    .value {
      font-size: 1.25rem;
    }
    
    svg {
      font-size: 0.9rem;
      margin-right: 0.35rem;
    }
  }
`;

const ChartContainer = styled.div`
  height: 300px;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    height: 250px;
    margin-bottom: 1.5rem;
  }
`;

const TableContainer = styled.div`
  overflow-x: auto;
  
  @media (max-width: 768px) {
    margin: 0 -1rem;
    padding: 0 1rem;
    width: calc(100% + 2rem);
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
  }
  
  @media (max-width: 768px) {
    border-radius: 6px;
    
    th, td {
      padding: 0.75rem 0.5rem;
      font-size: 0.9rem;
    }
  }
  
  th {
    background-color: #4776E6;
    font-weight: 600;
    color: white;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  tr:last-child td {
    border-bottom: none;
  }
  
  tr:hover td {
    background-color: #f7fafc;
  }
  
  tbody tr:nth-child(even) {
    background-color: #f9fafb;
  }
  
  .amount {
    font-weight: 600;
    text-align: right;
  }
  
  .positive {
    color: #38a169;
  }
  
  .negative {
    color: #e53e3e;
  }
  
  .center {
    text-align: center;
  }
  
  .transaction-type {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .type-host_commission {
    background-color: #C6F6D5;
    color: #22543D;
  }
  
  .type-gift_live {
    background-color: #BEE3F8;
    color: #2A4365;
  }
  
  .type-compensation {
    background-color: #FED7D7;
    color: #822727;
  }
  
  .type-top_up {
    background-color: #E9D8FD;
    color: #44337A;
  }
  
  .type-exchange {
    background-color: #FEEBC8;
    color: #7B341E;
  }
  
  .type-trading {
    background-color: #B2F5EA;
    color: #234E52;
  }
  
  .type-payout_withdraw {
    background-color: #FBD38D;
    color: #7B341E;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  
  svg {
    font-size: 2rem;
    color: #4776E6;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }
  
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const NoDataMessage = styled.div`
  text-align: center;
  padding: 3rem;
  color: #718096;
  
  p {
    margin-top: 0.5rem;
    font-size: 0.875rem;
  }
`;

const PieChartContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  justify-content: space-around;
  margin-bottom: 2rem;
`;

const PieChartWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 250px;
  
  h3 {
    margin-bottom: 1rem;
    font-size: 1rem;
    color: #4a5568;
  }
`;

const PieChart = styled.div`
  position: relative;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: conic-gradient(
    ${props => props.$segments || '#4776E6 0% 100%'}
  );
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100px;
    height: 100px;
    background: white;
    border-radius: 50%;
  }
`;

const ChartLegend = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 1.5rem;
  width: 100%;
  max-width: 250px;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  
  .color {
    width: 12px;
    height: 12px;
    border-radius: 2px;
    background-color: ${props => props.$color};
    margin-right: 0.5rem;
  }
  
  .label {
    flex: 1;
  }
  
  .value {
    font-weight: 500;
  }
`;

const DateRangeText = styled.div`
  font-size: 0.875rem;
  color: #718096;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 0.5rem;
  }
`;

// Main Component
const FinancialReports = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(subMonths(new Date(), 0)), 'yyyy-MM-dd')
  });
  const [reportData, setReportData] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [agencyData, setAgencyData] = useState(null);
  
  // State for filters
  const [filters, setFilters] = useState({
    period: 'last30days',
    transactionType: 'all'
  });
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'period') {
      let startDate, endDate;
      const today = new Date();
      
      switch (value) {
        case 'last7days':
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 7);
          endDate = today;
          break;
        case 'last30days':
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 30);
          endDate = today;
          break;
        case 'thisMonth':
          startDate = startOfMonth(today);
          endDate = today;
          break;
        case 'lastMonth':
          startDate = startOfMonth(subMonths(today, 1));
          endDate = endOfMonth(subMonths(today, 1));
          break;
        case 'last3Months':
          startDate = subMonths(today, 3);
          endDate = today;
          break;
        case 'custom':
          // Keep existing dates for custom
          startDate = new Date(dateRange.startDate);
          endDate = new Date(dateRange.endDate);
          break;
        default:
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 30);
          endDate = today;
      }
      
      setDateRange({
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd')
      });
    }
    
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle date range changes
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Set period to custom when dates are manually changed
    if (filters.period !== 'custom') {
      setFilters(prev => ({
        ...prev,
        period: 'custom'
      }));
    }
  };
  
  // Apply filters and fetch data
  const applyFilters = async () => {
    setLoading(true);
    try {
      await fetchReportData();
    } catch (error) {
      console.error('Error applying filters:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Export PDF report with agency details
  const exportPdf = () => {
    if (!reportData || !agencyData) return;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Define margins and layout dimensions
    const marginTop = 15;
    const marginLeft = 15;
    const marginRight = 15;
    const headerHeight = 40;
    
    // Draw header border
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(marginLeft, marginTop + headerHeight, pageWidth - marginRight, marginTop + headerHeight);
    
    // Left column: Logo only
    if (agencyData.logo) {
      const img = new Image();
      img.src = agencyData.logo;
      doc.addImage(img, 'PNG', marginLeft, marginTop, 30, 30);
    }
    
    // Document title at the bottom of the header near the line
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text(t('dashboard.financialReports.financialReport'), pageWidth / 2, marginTop + headerHeight - 5, { align: 'center' });
    
    // Right column: Company Information
    // Calculate right column position - ensure no overlap with center column
    const rightColumnWidth = 75;
    const rightColumnX = pageWidth - marginRight - rightColumnWidth;
    let rightColumnY = marginTop + 5;
    
    // Agency name at the top of right column
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text(agencyData.name || '', rightColumnX, rightColumnY);
    rightColumnY += 6;
    
    // Company name header
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(80, 80, 80);
    
    if (agencyData.companyName) {
      doc.text(agencyData.companyName, rightColumnX, rightColumnY);
      rightColumnY += 4;
    }
    
    // Company contact information
    doc.setFont(undefined, 'normal');
    
    // Address
    if (agencyData.companyAddress) {
      let address = agencyData.companyAddress;
      if (agencyData.companyCity) address += `, ${agencyData.companyCity}`;
      if (agencyData.companyPostalCode) address += `, ${agencyData.companyPostalCode}`;
      if (agencyData.companyCountry) address += `, ${agencyData.companyCountry}`;
      
      // Split address into multiple lines if needed
      const addressLines = doc.splitTextToSize(address, rightColumnWidth);
      addressLines.forEach(line => {
        doc.text(line, rightColumnX, rightColumnY);
        rightColumnY += 4;
      });
    }
    
    // Email
    if (agencyData.email) {
      doc.text(agencyData.email, rightColumnX, rightColumnY);
      rightColumnY += 4;
    }
    
    // Registration number and Tax ID
    if (agencyData.companyRegistrationNumber) {
      doc.text(`${t('dashboard.agency.registrationNumber')}: ${agencyData.companyRegistrationNumber}`, rightColumnX, rightColumnY);
      rightColumnY += 4;
    }
    
    if (agencyData.companyTaxId) {
      doc.text(`${t('dashboard.agency.taxId')}: ${agencyData.companyTaxId}`, rightColumnX, rightColumnY);
      rightColumnY += 4;
    }
    
    // Set position for the rest of the content - ensure proper spacing after the header
    let yPos = marginTop + headerHeight + 15;
    
    // Add report period
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text(`${t('dashboard.financialReports.reportPeriod')}: ${dateRange.startDate} ${t('common.to')} ${dateRange.endDate}`, marginLeft, yPos);
    
    // Calculate column widths for side-by-side layout
    const halfWidth = (pageWidth - marginLeft - marginRight) / 2 - 5; // 5px buffer between columns
    const leftColX = marginLeft;
    const rightColX = marginLeft + halfWidth + 10; // 10px space between columns
    
    // Start position for both sections
    yPos += 15;
    const sectionStartY = yPos;
    
    // Left column: Revenue Summary
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text(t('dashboard.financialReports.revenueSummary'), leftColX, yPos);
    
    // Main revenue data
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(`${t('dashboard.financialReports.hostRevenue')}: $${reportData.summary.hostRevenueUsd.toFixed(2)}`, leftColX + 5, yPos);
    
    yPos += 8;
    doc.text(`${t('dashboard.financialReports.agencyRevenue')}: $${reportData.summary.agencyRevenueUsd.toFixed(2)}`, leftColX + 5, yPos);
    
    // Right column: Transaction Types
    let rightColY = sectionStartY; // Reset Y position for right column
    
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text(t('dashboard.financialReports.transactionTypes'), rightColX, rightColY);
    
    // Transaction type data
    rightColY += 10;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(60, 60, 60);
    
    const transactionTypes = [
      { key: Transaction.transactionType.COMPENSATION, label: t('dashboard.financialReports.compensation') },
      { key: Transaction.transactionType.TOP_UP, label: t('dashboard.financialReports.topUp') },
      { key: Transaction.transactionType.EXCHANGE, label: t('dashboard.financialReports.exchange') },
      { key: Transaction.transactionType.TRADING, label: t('dashboard.financialReports.trading') },
      { key: Transaction.transactionType.PAYOUT_WITHDRAW, label: t('dashboard.financialReports.payoutWithdraw') }
    ];
    
    transactionTypes.forEach(type => {
      doc.text(`${type.label}: $${reportData.summary.revenueByTypeUsd[type.key].toFixed(2)}`, rightColX + 5, rightColY);
      rightColY += 7;
    });
    
    // Set yPos to the maximum of both columns for next content
    yPos = Math.max(yPos, rightColY) + 5;
    
    // Transaction history table
    yPos += 15;
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text(t('dashboard.financialReports.transactionHistory'), marginLeft, yPos);
    yPos += 10;
    
    // Create transaction table
    const tableColumns = [
      { header: t('dashboard.financialReports.date'), dataKey: 'date' },
      { header: t('dashboard.financialReports.type'), dataKey: 'type' },
      { header: t('dashboard.financialReports.from'), dataKey: 'from' },
      { header: t('dashboard.financialReports.to'), dataKey: 'to' },
      { header: t('dashboard.financialReports.diamonds'), dataKey: 'diamonds' },
      { header: t('dashboard.financialReports.usdAmount'), dataKey: 'usd' }
    ];
    
    const tableData = reportData.transactions.map(transaction => ({
      date: transaction.date,
      type: transaction.translatedType,
      from: transaction.authorName,
      to: transaction.receiverName,
      diamonds: transaction.diamonds.toLocaleString(),
      usd: `$${transaction.usdAmount.toFixed(2)}`
    }));
    
    autoTable(doc, {
      startY: yPos,
      head: [tableColumns.map(col => col.header)],
      body: tableData.map(row => tableColumns.map(col => row[col.dataKey])),
      theme: 'grid',
      headStyles: { fillColor: [71, 118, 230], textColor: 255, fontStyle: 'bold' },
      bodyStyles: { textColor: 60, fontSize: 9 },
      alternateRowStyles: { fillColor: [245, 245, 250] },
      margin: { left: marginLeft, right: marginRight },
      tableLineWidth: 0.1,
      tableLineColor: [200, 200, 200]
    });
    
    // Add footer with date and page number
    const today = new Date();
    const dateStr = format(today, 'yyyy-MM-dd');
    
    // Draw footer line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(marginLeft, pageHeight - 20, pageWidth - marginRight, pageHeight - 20);
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`${t('dashboard.financialReports.generatedOn')}: ${dateStr}`, marginLeft, pageHeight - 12);
    
    // Add page number and document title in footer
    doc.text(`${t('app.name')} - ${t('dashboard.financialReports.financialReport')}`, pageWidth / 2, pageHeight - 12, { align: 'center' });
    doc.text('1', pageWidth - marginRight, pageHeight - 12, { align: 'right' });
    
    // Save the PDF with a well-formatted name
    const fileName = `${agencyData.name || t('dashboard.financialReports.financialReport')}_${dateRange.startDate}_${dateRange.endDate}.pdf`;
    doc.save(fileName);
  };
  
  // Fetch report data
  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const currentUser = Parse.User.current();
      if (!currentUser) {
        console.error('No user is logged in');
        setLoading(false);
        return;
      }
      
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      endDate.setHours(23, 59, 59, 999); // Set to end of day
      
      // Query transactions related to current user - only host commission and compensation
      const authorQuery = new Parse.Query(Transaction);
      authorQuery.equalTo('authorId', currentUser.id);
      authorQuery.greaterThanOrEqualTo('createdAt', startDate);
      authorQuery.lessThanOrEqualTo('createdAt', endDate);
      
      const receiverQuery = new Parse.Query(Transaction);
      receiverQuery.equalTo('receiverId', currentUser.id);
      receiverQuery.greaterThanOrEqualTo('createdAt', startDate);
      receiverQuery.lessThanOrEqualTo('createdAt', endDate);
      
      // Combine queries with OR
      const transactionQuery = Parse.Query.or(authorQuery, receiverQuery);
      
      // Include all relevant transaction types
      const typeQueries = [
        Transaction.transactionType.HOST_COMMISSION,
        Transaction.transactionType.COMPENSATION,
        Transaction.transactionType.PAYOUT_WITHDRAW,
        Transaction.transactionType.TOP_UP,
        Transaction.transactionType.EXCHANGE,
        Transaction.transactionType.TRADING
      ].map(type => {
        const query = new Parse.Query(Transaction);
        query.equalTo('type', type);
        return query;
      });
      
      const typeQuery = Parse.Query.or(...typeQueries);
      
      // Combine with the user-related query
      const finalQuery = Parse.Query.and(transactionQuery, typeQuery);
      
      // Apply transaction type filter if specified
      if (filters.transactionType !== 'all') {
        finalQuery.equalTo('type', filters.transactionType);
      }
      
      finalQuery.include('author');
      finalQuery.include('receiver');
      finalQuery.limit(1000); // Adjust as needed
      finalQuery.descending('createdAt');
      
      const transactions = await finalQuery.find();
      
      // Query agent stats for the current user's agency
      const statsQuery = new Parse.Query(AgentStats);
      statsQuery.equalTo(AgentStats.keys.AUTHOR_ID, currentUser.id);
      statsQuery.greaterThanOrEqualTo('createdAt', startDate);
      statsQuery.lessThanOrEqualTo('createdAt', endDate);
      statsQuery.descending('createdAt');
      
      const agentStats = await statsQuery.find();
      
      // Process transaction data
      // Calculate revenue by transaction type
      const revenueByType = {
        [Transaction.transactionType.HOST_COMMISSION]: 0,
        [Transaction.transactionType.COMPENSATION]: 0,
        [Transaction.transactionType.TOP_UP]: 0,
        [Transaction.transactionType.EXCHANGE]: 0,
        [Transaction.transactionType.TRADING]: 0,
        [Transaction.transactionType.PAYOUT_WITHDRAW]: 0,
        [Transaction.transactionType.GIFT_LIVE]: 0
      };
      
      // Calculate revenue for each transaction type
      transactions.forEach(transaction => {
        const type = transaction.get(Transaction.keys.TRANSACTION_TYPE);
        const diamonds = transaction.get(Transaction.keys.DIAMONDS) || 0;
        
        if (revenueByType[type] !== undefined) {
          revenueByType[type] += diamonds;
        }
      });
      
      // Calculate host and agency revenue
      //const hostRevenue = revenueByType[Transaction.transactionType.HOST_COMMISSION];
      
      const agencyRevenue = agentStats.reduce((sum, stat) => {
        return sum + (stat.get(AgentStats.keys.TOTAL_COMMISSION) || 0);
      }, 0);


      const hostRevenue = agentStats.reduce((sum, stat) => {
        return sum + (stat.get(AgentStats.keys.HOST_EARNING) || 0);
      }, 0);
      
      // Calculate percentages - only between host and agency now
      const totalRevenue = hostRevenue + agencyRevenue;
      const hostPercentage = totalRevenue > 0 ? (hostRevenue / totalRevenue) * 100 : 0;
      const agencyPercentage = totalRevenue > 0 ? (agencyRevenue / totalRevenue) * 100 : 0;
      
      // Prepare transaction data for table and CSV export
      const transactionData = transactions.map(transaction => {
        const type = transaction.get(Transaction.keys.TRANSACTION_TYPE);
        const diamonds = transaction.get(Transaction.keys.DIAMONDS) || 0;
        const author = transaction.get(Transaction.keys.AUTHOR);
        const receiver = transaction.get(Transaction.keys.RECEIVER);
        
        // Get translated transaction type
        let translatedType;
        switch(type) {
          case Transaction.transactionType.HOST_COMMISSION:
            translatedType = t('dashboard.financialReports.hostCommission');
            break;
          case Transaction.transactionType.GIFT_LIVE:
            translatedType = t('dashboard.financialReports.giftLive');
            break;
          case Transaction.transactionType.COMPENSATION:
            translatedType = t('dashboard.financialReports.compensation');
            break;
          case Transaction.transactionType.TOP_UP:
            translatedType = t('dashboard.financialReports.topUp') || 'Top Up';
            break;
          case Transaction.transactionType.EXCHANGE:
            translatedType = t('dashboard.financialReports.exchange') || 'Exchange';
            break;
          case Transaction.transactionType.TRADING:
            translatedType = t('dashboard.financialReports.trading') || 'Trading';
            break;
          case Transaction.transactionType.PAYOUT_WITHDRAW:
            translatedType = t('dashboard.financialReports.payoutWithdraw') || 'Payout Withdraw';
            break;
          default:
            translatedType = type;
        }
        
        // Get current user's agency name
        const currentUser = Parse.User.current();
        const agencyName = 'Agency';
        
        // Set custom from/to values based on transaction type
        let authorName, receiverName;
        
        switch(type) {
          case Transaction.transactionType.TOP_UP:
            authorName = 'Platform';
            receiverName = receiver && receiver.get(User.keys.FULL_NAME) ? receiver.get(User.keys.FULL_NAME) : (receiver ? receiver.get(User.keys.USERNAME) : 'N/A');
            break;
          case Transaction.transactionType.COMPENSATION:
            authorName = agencyName;
            receiverName = receiver && receiver.get(User.keys.FULL_NAME) ? receiver.get(User.keys.FULL_NAME) : (receiver ? receiver.get(User.keys.USERNAME) : 'N/A');
            break;
          case Transaction.transactionType.PAYOUT_WITHDRAW:
            authorName = author && author.get(User.keys.FULL_NAME) ? author.get(User.keys.FULL_NAME) : (author ? author.get(User.keys.USERNAME) : 'Unknown');
            receiverName = 'Bank/Wallet';
            break;
          default:
            authorName = author && author.get(User.keys.FULL_NAME) ? author.get(User.keys.FULL_NAME) : (author ? author.get(User.keys.USERNAME) : 'Unknown');
            receiverName = receiver && receiver.get(User.keys.FULL_NAME) ? receiver.get(User.keys.FULL_NAME) : (receiver ? receiver.get(User.keys.USERNAME) : 'N/A');
        }
        
        return {
          id: transaction.id,
          date: format(transaction.createdAt, 'yyyy-MM-dd HH:mm'),
          type,
          translatedType,
          typeClass: `type-${type.replace(/\s+/g, '_').toLowerCase()}`,
          diamonds,
          usdAmount: diamondsToUsd(diamonds),
          authorName,
          receiverName
        };
      });
      
      // Prepare CSV data
      const csvData = [
        [
          t('dashboard.financialReports.date'), 
          t('dashboard.financialReports.type'), 
          t('dashboard.financialReports.diamonds'), 
          t('dashboard.financialReports.usdAmount'), 
          t('dashboard.financialReports.from'), 
          t('dashboard.financialReports.to')
        ],
        ...transactionData.map(t => [
          t.date,
          t.translatedType,
          t.diamonds,
          `$${t.usdAmount.toFixed(2)}`,
          t.authorName,
          t.receiverName
        ])
      ];
      
      // Set state with processed data
      setReportData({
        transactions: transactionData,
        summary: {
          hostRevenue,
          hostRevenueUsd: diamondsToUsd(hostRevenue),
          agencyRevenue,
          agencyRevenueUsd: diamondsToUsd(agencyRevenue),
          hostPercentage,
          agencyPercentage,
          revenueByType,
          revenueByTypeUsd: {
            [Transaction.transactionType.HOST_COMMISSION]: diamondsToUsd(revenueByType[Transaction.transactionType.HOST_COMMISSION]),
            [Transaction.transactionType.COMPENSATION]: diamondsToUsd(revenueByType[Transaction.transactionType.COMPENSATION]),
            [Transaction.transactionType.TOP_UP]: diamondsToUsd(revenueByType[Transaction.transactionType.TOP_UP]),
            [Transaction.transactionType.EXCHANGE]: diamondsToUsd(revenueByType[Transaction.transactionType.EXCHANGE]),
            [Transaction.transactionType.TRADING]: diamondsToUsd(revenueByType[Transaction.transactionType.TRADING]),
            [Transaction.transactionType.PAYOUT_WITHDRAW]: diamondsToUsd(revenueByType[Transaction.transactionType.PAYOUT_WITHDRAW]),
            [Transaction.transactionType.GIFT_LIVE]: diamondsToUsd(revenueByType[Transaction.transactionType.GIFT_LIVE])
          }
        }
      });
      
      setCsvData(csvData);
      
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch agency data for PDF export
  const fetchAgencyData = async () => {
    try {
      const currentUser = Parse.User.current();
      if (!currentUser) return;
      
      const query = new Parse.Query(Agent);
      query.equalTo(Agent.keys.AUTHOR_ID, currentUser.id);
      const agent = await query.first();
      
      if (agent) {
        setAgencyData({
          name: agent.name || '',
          logo: agent.logo ? agent.logo.url() : '',
          email: agent.contactEmail || '',
          companyName: agent.companyName || '',
          companyRegistrationNumber: agent.companyRegistrationNumber || '',
          companyTaxId: agent.companyTaxId || '',
          companyAddress: agent.companyAddress || '',
          companyCity: agent.companyCity || '',
          companyPostalCode: agent.companyPostalCode || '',
          companyCountry: agent.companyCountry || ''
        });
      }
    } catch (error) {
      console.error('Error fetching agency data:', error);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchReportData();
    fetchAgencyData();
  }, []);
  
  // Format date range for display
  const formattedDateRange = `${format(new Date(dateRange.startDate), 'MMM d, yyyy')} - ${format(new Date(dateRange.endDate), 'MMM d, yyyy')}`;
  
  // State for withdraw modal
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isProcessingWithdraw, setIsProcessingWithdraw] = useState(false);
  const [availableBalance, setAvailableBalance] = useState(0);
  const modalRef = useRef(null);
  
  // Constants for withdraw limits - using ConfigService
  const config = ConfigService.getInstance();
  const MIN_WITHDRAW_AMOUNT = config.getDiamondsNeededToRedeem(); // Minimum withdrawal amount from config
  const MAX_WITHDRAW_AMOUNT = 1000000; // Maximum withdrawal amount in diamonds
  const WITHDRAW_FEE_PERCENTAGE = config.getPayoutValletFees(); // Withdrawal fee percentage from config
  
  // Fetch available balance
  useEffect(() => {
    const fetchAvailableBalance = async () => {
      try {
        const currentUser = Parse.User.current();
        if (currentUser) {
          // Get the diamonds directly from the user object
          const userQuery = new Parse.Query(Parse.User);
          const user = await userQuery.get(currentUser.id);
          
          // Check for diamonds in the user object
          const diamondsBalance = user.get(User.keys.DIAMONDS);
          
          if (diamondsBalance && !isNaN(diamondsBalance)) {
            setAvailableBalance(diamondsBalance);
          } else {
            setAvailableBalance(0);
          }
        }
      } catch (error) {
        console.error('Error fetching available balance:', error);
        // Set a default balance for demo purposes
        setAvailableBalance(0);
      }
    };
    
    fetchAvailableBalance();
  }, []);
  
  // Check if user has a payment method set up
  const [hasPaymentMethod, setHasPaymentMethod] = useState(true);
  
  // Check for payment method when opening withdraw modal
  useEffect(() => {
    const checkPaymentMethod = async () => {
      try {
        const currentUser = Parse.User.current();
        if (currentUser) {
          // Check if user has a selected payment method
          const selectedMethod = currentUser.get(User.keys.SELECTED_PAYMENT_METHOD);
          setHasPaymentMethod(!!selectedMethod);
        }
      } catch (error) {
        console.error('Error checking payment method:', error);
        setHasPaymentMethod(false);
      }
    };
    
    if (showWithdrawModal) {
      checkPaymentMethod();
    }
  }, [showWithdrawModal]);
  
  // Handle withdraw button click
  const handleWithdraw = async () => {
    try {
      const currentUser = Parse.User.current();
      if (currentUser) {
        // Check if user has a selected payment method
        const selectedMethod = currentUser.get(User.keys.SELECTED_PAYMENT_METHOD);
        
        if (!selectedMethod) {
          // If no payment method, ask user to add one first
          if (window.confirm(t('dashboard.financialReports.withdrawModal.noBankAccount') + '. ' + 
                             t('dashboard.financialReports.withdrawModal.updateBankInfo') + '?')) {
            // Redirect to settings page
            window.location.href = '/settings';
            return;
          }
          return;
        }
      }
      
      // If payment method exists, show the withdraw modal
      setShowWithdrawModal(true);
    } catch (error) {
      console.error('Error checking payment method:', error);
      toast.error(t('dashboard.financialReports.withdrawError'));
    }
  };
  
  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowWithdrawModal(false);
      }
    };
    
    if (showWithdrawModal) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showWithdrawModal]);
  
  // Handle amount change with validation
  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setWithdrawAmount(value);
  };
  
  // Calculate final withdrawal amount after fees
  const calculateFinalAmount = (amount) => {
    if (!amount || isNaN(amount)) return 0;
    const usdAmount = diamondsToUsd(Number(amount));
    const feeAmount = usdAmount * (WITHDRAW_FEE_PERCENTAGE / 100);
    return usdAmount - feeAmount;
  };
  
  // Determine if the amount exceeds available balance
  const isExceedingBalance = () => {
    return withdrawAmount && Number(withdrawAmount) > availableBalance;
  };
  
  // Submit withdraw request
  const submitWithdrawRequest = async () => {
    // Check if user has a payment method set up
    const currentUser = Parse.User.current();
    if (currentUser) {
      const selectedMethod = currentUser.get(User.keys.SELECTED_PAYMENT_METHOD);
      if (!selectedMethod) {
        toast.error(t('dashboard.financialReports.withdrawModal.noBankAccount'));
        setShowWithdrawModal(false);
        
        // Wait a little before redirecting
        setTimeout(() => {
          window.location.href = '/settings';
        }, 1500);
        return;
      }
    }
    
    if (!withdrawAmount || isNaN(withdrawAmount) || Number(withdrawAmount) < MIN_WITHDRAW_AMOUNT) {
      toast.error(t('dashboard.financialReports.withdrawModal.minWithdraw', { amount: MIN_WITHDRAW_AMOUNT }));
      return;
    }
    
    if (Number(withdrawAmount) > availableBalance) {
      toast.error(t('dashboard.financialReports.withdrawModal.insufficientBalance'));
      return;
    }
    
    if (Number(withdrawAmount) > MAX_WITHDRAW_AMOUNT) {
      toast.error(t('dashboard.financialReports.withdrawModal.maxWithdraw', { amount: MAX_WITHDRAW_AMOUNT }));
      return;
    }
    
    setIsProcessingWithdraw(true);
    
    try {
      const currentUser = Parse.User.current();
      const userQuery = new Parse.Query(Parse.User);
      const user = await userQuery.get(currentUser.id);
      
      // Get selected payment method
      const selectedPaymentMethodPointer = user.get(User.keys.SELECTED_PAYMENT_METHOD);
      if (!selectedPaymentMethodPointer) {
        throw new Error('No payment method selected');
      }
      
      // Fetch the full payment method object
      const paymentMethodQuery = new Parse.Query(PayoutMethod);
      const paymentMethod = await paymentMethodQuery.get(selectedPaymentMethodPointer.id);
      
      // Calculate amount and fees
      const diamondsAmount = Number(withdrawAmount);
      const moneyAmount = diamondsToUsd(diamondsAmount);
      const feePercentage = config.getPayoutValletFees();
      const feeAmount = (moneyAmount / 100) * feePercentage;
      const amountToPay = moneyAmount - feeAmount;
      
      // Prepare parameters for cloud function
      const params = {
        user: currentUser.id,
        status: 'pending',
        completed: false,
        method: paymentMethod.get(PayoutMethod.keys.PAYMENT_METHOD),
        currency: 'USD',
        diamonds: diamondsAmount,
        amount: moneyAmount,
        amount_to_pay: amountToPay,
        fees: feePercentage,
        fees_amount: feeAmount,
        arrival_hours: config.getPayoutArrivalHours(), // Dynamic from server config
        address: paymentMethod.get(PayoutMethod.keys.ACCOUNT_ID),
        name: paymentMethod.get(PayoutMethod.keys.NAME),
        surname: paymentMethod.get(PayoutMethod.keys.SURNAME),
        country: paymentMethod.get(PayoutMethod.keys.COUNTRY),
        city: paymentMethod.get(PayoutMethod.keys.CITY),
        bank_name: paymentMethod.get(PayoutMethod.keys.BANK_NAME),
        account_wallet: paymentMethod.get(PayoutMethod.keys.ACCOUNT_ID),
        phone_number: paymentMethod.get(PayoutMethod.keys.PHONE_NUMBER),
        email: paymentMethod.get(PayoutMethod.keys.EMAIL)
      };
      
      // Call the cloud function to process withdrawal
      await Parse.Cloud.run('process_withdrawn', params);
      
      // Refresh user data to get updated balance
      const refreshedUserQuery = new Parse.Query(Parse.User);
      refreshedUserQuery.include(User.keys.SELECTED_PAYMENT_METHOD);
      const refreshedUser = await refreshedUserQuery.get(currentUser.id);
      
      // Get updated diamond balance
      const updatedBalance = refreshedUser.get(User.keys.DIAMONDS) || 0;
      setAvailableBalance(updatedBalance); // Update UI with latest balance
      
      toast.success(t('dashboard.financialReports.withdrawSuccess'));
      setShowWithdrawModal(false);
      setWithdrawAmount('');
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast.error(t('dashboard.financialReports.withdrawError'));
    } finally {
      setIsProcessingWithdraw(false);
    }
  };
  
  return (
    <Container>
      <PageTitle>
        <FaChartPie />
        {t('dashboard.financialReports.title')}
      </PageTitle>
      
      <WithdrawButtonContainer>
        <WithdrawButton onClick={handleWithdraw}>
          <FaUniversity />
          {t('dashboard.financialReports.withdrawMoney')}
        </WithdrawButton>
      </WithdrawButtonContainer>
      
      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <ModalOverlay>
          <WithdrawModal ref={modalRef}>
            <ModalHeader>
              <h2>{t('dashboard.financialReports.withdrawModal.title')}</h2>
              <CloseButton onClick={() => setShowWithdrawModal(false)}>
                <FaTimes />
              </CloseButton>
            </ModalHeader>
            
            <ModalBody>
              <p className="subtitle">{t('dashboard.financialReports.withdrawModal.subtitle')}</p>
              
              <BalanceInfo>
                <span className="label">{t('dashboard.financialReports.withdrawModal.availableBalance')}:</span>
                <span className="value">
                  {availableBalance.toLocaleString()} {t('common.diamonds')}
                  <span className="usd-value">({convertDiamondsToUsdFormat(availableBalance)})</span>
                </span>
              </BalanceInfo>
              
              <InputGroup>
                <label htmlFor="withdraw-amount">{t('dashboard.financialReports.withdrawModal.amountLabel')}</label>
                <input
                  id="withdraw-amount"
                  type="text"
                  value={withdrawAmount}
                  onChange={handleAmountChange}
                  placeholder={t('dashboard.financialReports.withdrawModal.amountPlaceholder')}
                  disabled={isProcessingWithdraw}
                  className={Number(withdrawAmount) > availableBalance ? 'error' : ''}
                />
              </InputGroup>
              
              {withdrawAmount && (
                <ConversionInfo className={isExceedingBalance() ? 'error' : ''}>
                  {isExceedingBalance() && (
                    <ErrorMessage>
                      <FaExclamationTriangle className="icon" />
                      {t('dashboard.financialReports.withdrawModal.insufficientBalance', 'Amount exceeds available balance')}
                    </ErrorMessage>
                  )}
                  <ConversionDetail>
                    <span className="label">{t('dashboard.financialReports.withdrawModal.estimatedValue')}:</span>
                    <span className="value">{formatUsd(diamondsToUsd(Number(withdrawAmount) || 0))}</span>
                  </ConversionDetail>
                  
                  <ConversionDetail>
                    <span className="label">{t('dashboard.financialReports.withdrawModal.withdrawalFee')} ({WITHDRAW_FEE_PERCENTAGE}%):</span>
                    <span className="value">{formatUsd(diamondsToUsd(Number(withdrawAmount) || 0) * (WITHDRAW_FEE_PERCENTAGE / 100))}</span>
                  </ConversionDetail>
                  
                  <ConversionDetail className="total">
                    <span className="label">{t('dashboard.financialReports.withdrawModal.totalAmount')}:</span>
                    <span className="value">{formatUsd(diamondsToUsd(Number(withdrawAmount) || 0) * (1 - WITHDRAW_FEE_PERCENTAGE / 100))}</span>
                  </ConversionDetail>
                  
                  <ConversionDetail>
                    <span className="label">{t('dashboard.financialReports.withdrawModal.conversionRate')}:</span>
                    <span className="value">1 {t('common.diamonds')} ≈ {formatUsd(diamondsToUsd(1))}</span>
                  </ConversionDetail>
                </ConversionInfo>
              )}
              
              <WithdrawInfo>
                <FaUniversity className="icon" />
                <span>
                  {hasPaymentMethod ? 
                    t('dashboard.financialReports.withdrawModal.bankAccount') : 
                    <>
                      {t('dashboard.financialReports.withdrawModal.noBankAccount')}
                      <NoPaymentMethodLink onClick={() => {
                        setShowWithdrawModal(false);
                        window.location.href = '/settings';
                      }}>
                        {t('dashboard.financialReports.withdrawModal.goToSettings')}
                      </NoPaymentMethodLink>
                    </>
                  }
                </span>
              </WithdrawInfo>
              
              <LimitsInfo>
                <div className="limit">
                  <span className="limit-label">Min:</span>
                  <span className="limit-value">{MIN_WITHDRAW_AMOUNT.toLocaleString()} {t('common.diamonds')}</span>
                </div>
                <div className="limit">
                  <span className="limit-label">Max:</span>
                  <span className="limit-value">{MAX_WITHDRAW_AMOUNT.toLocaleString()} {t('common.diamonds')}</span>
                </div>
              </LimitsInfo>
            </ModalBody>
            
            <ModalFooter>
              <CancelButton 
                onClick={() => setShowWithdrawModal(false)} 
                disabled={isProcessingWithdraw}
              >
                {t('dashboard.financialReports.withdrawModal.cancelButton')}
              </CancelButton>
              
              <SubmitButton 
                onClick={submitWithdrawRequest} 
                disabled={isProcessingWithdraw || !withdrawAmount || Number(withdrawAmount) < MIN_WITHDRAW_AMOUNT || Number(withdrawAmount) > availableBalance}
              >
                {isProcessingWithdraw ? (
                  <>
                    <FaSpinner className="spinner" />
                    {t('dashboard.financialReports.withdrawModal.processing')}
                  </>
                ) : (
                  t('dashboard.financialReports.withdrawModal.withdrawButton')
                )}
              </SubmitButton>
            </ModalFooter>
          </WithdrawModal>
        </ModalOverlay>
      )}
      
      <FiltersContainer>
        <FilterGroup>
          <label>{t('dashboard.financialReports.period')}</label>
          <select 
            name="period"
            value={filters.period}
            onChange={handleFilterChange}
          >
            <option value="last7days">{t('dashboard.financialReports.last7days')}</option>
            <option value="last30days">{t('dashboard.financialReports.last30days')}</option>
            <option value="thisMonth">{t('dashboard.financialReports.thisMonth')}</option>
            <option value="lastMonth">{t('dashboard.financialReports.lastMonth')}</option>
            <option value="last3Months">{t('dashboard.financialReports.last3Months')}</option>
            <option value="custom">{t('dashboard.financialReports.custom')}</option>
          </select>
        </FilterGroup>
        
        {filters.period === 'custom' && (
          <>
            <FilterGroup>
              <label>{t('dashboard.financialReports.startDate')}</label>
              <input 
                type="date" 
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateChange}
                max={dateRange.endDate}
              />
            </FilterGroup>
            
            <FilterGroup>
              <label>{t('dashboard.financialReports.endDate')}</label>
              <input 
                type="date" 
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateChange}
                min={dateRange.startDate}
                max={format(new Date(), 'yyyy-MM-dd')}
              />
            </FilterGroup>
          </>
        )}
        
        <FilterGroup>
          <label>{t('dashboard.financialReports.transactionType')}</label>
          <select 
            name="transactionType"
            value={filters.transactionType}
            onChange={handleFilterChange}
          >
            <option value="all">{t('dashboard.financialReports.allTypes')}</option>
            <option value={Transaction.transactionType.HOST_COMMISSION}>{t('dashboard.financialReports.hostCommission')}</option>
            <option value={Transaction.transactionType.COMPENSATION}>{t('dashboard.financialReports.compensation')}</option>
            <option value={Transaction.transactionType.TOP_UP}>{t('dashboard.financialReports.topUp')}</option>
            <option value={Transaction.transactionType.EXCHANGE}>{t('dashboard.financialReports.exchange')}</option>
            <option value={Transaction.transactionType.TRADING}>{t('dashboard.financialReports.trading')}</option>
            <option value={Transaction.transactionType.PAYOUT_WITHDRAW}>{t('dashboard.financialReports.payoutWithdraw')}</option>
          </select>
        </FilterGroup>
        
        <FilterButton onClick={applyFilters} disabled={loading}>
          <FaFilter />
          {t('dashboard.financialReports.applyFilters')}
        </FilterButton>
        
        {reportData && (
          <>
            <ExportButton>
              <CSVLink 
                data={csvData} 
                filename={`financial-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`}
              >
                <FaDownload />
                {t('dashboard.financialReports.exportCsv')}
              </CSVLink>
            </ExportButton>
            
            <PdfExportButton 
              onClick={exportPdf} 
              disabled={!agencyData}
            >
              <FaFilePdf />
              {t('dashboard.financialReports.exportPdf')}
            </PdfExportButton>
          </>
        )}
      </FiltersContainer>
      
      <DateRangeText>
        <FaCalendarAlt />
        {t('dashboard.financialReports.showingDataFor')} {formattedDateRange}
      </DateRangeText>
      
      {loading ? (
        <LoadingContainer>
          <FaSpinner />
          <p>{t('common.loading')}</p>
        </LoadingContainer>
      ) : reportData ? (
        <>
          <ReportCard>
            <ReportHeader>
              <h2>
                <FaChartPie />
                {t('dashboard.financialReports.revenueSummary')}
              </h2>
            </ReportHeader>
            <ReportContent>
              <ModernStatsContainer>
                {/* Main Revenue Cards */}
                <MainRevenueCards>
                  {/* Host Revenue */}
                  <MainRevenueCard>
                    <RevenueCardHeader $color="#ECC94B">
                      <div className="icon-container">
                        <FaUsers className="icon" />
                      </div>
                      <div className="title">{t('dashboard.financialReports.hostCommission')}</div>
                    </RevenueCardHeader>
                    <RevenueCardContent>
                      <div className="amount">${reportData.summary.hostRevenueUsd.toFixed(2)}</div>
                      <div className="points">{reportData.summary.hostRevenue.toLocaleString()} {t('common.diamonds')}</div>
                    </RevenueCardContent>
                  </MainRevenueCard>

                  {/* Agency Revenue */}
                  <MainRevenueCard>
                    <RevenueCardHeader $color="#3182CE">
                      <div className="icon-container">
                        <FaBuilding className="icon" />
                      </div>
                      <div className="title">{t('dashboard.financialReports.agencyRevenue')}</div>
                    </RevenueCardHeader>
                    <RevenueCardContent>
                      <div className="amount">${reportData.summary.agencyRevenueUsd.toFixed(2)}</div>
                      <div className="points">{reportData.summary.agencyRevenue.toLocaleString()} {t('common.diamonds')}</div>
                    </RevenueCardContent>
                  </MainRevenueCard>
                </MainRevenueCards>

                {/* Transaction Type Cards */}
                <TransactionTypeCards>
                  {/* Compensation */}
                  <TransactionTypeCard>
                    <TransactionTypeIcon $bgColor="#E6FFFA" $iconColor="#38B2AC">
                      <FaHandHoldingUsd />
                    </TransactionTypeIcon>
                    <TransactionTypeDetails>
                      <div className="type-name">{t('dashboard.financialReports.compensation')}</div>
                      <div className="type-amount">${reportData.summary.revenueByTypeUsd[Transaction.transactionType.COMPENSATION].toFixed(2)}</div>
                      <div className="type-points">{reportData.summary.revenueByType[Transaction.transactionType.COMPENSATION].toLocaleString()} {t('common.diamonds')}</div>
                    </TransactionTypeDetails>
                  </TransactionTypeCard>

                  {/* Top Up */}
                  <TransactionTypeCard>
                    <TransactionTypeIcon $bgColor="#E9D8FD" $iconColor="#805AD5">
                      <FaArrowUp />
                    </TransactionTypeIcon>
                    <TransactionTypeDetails>
                      <div className="type-name">{t('dashboard.financialReports.topUp')}</div>
                      <div className="type-amount">${reportData.summary.revenueByTypeUsd[Transaction.transactionType.TOP_UP].toFixed(2)}</div>
                      <div className="type-points">{reportData.summary.revenueByType[Transaction.transactionType.TOP_UP].toLocaleString()} {t('common.diamonds')}</div>
                    </TransactionTypeDetails>
                  </TransactionTypeCard>

                  {/* Exchange */}
                  <TransactionTypeCard>
                    <TransactionTypeIcon $bgColor="#FEEBC8" $iconColor="#DD6B20">
                      <FaExchangeAlt />
                    </TransactionTypeIcon>
                    <TransactionTypeDetails>
                      <div className="type-name">{t('dashboard.financialReports.exchange')}</div>
                      <div className="type-amount">${reportData.summary.revenueByTypeUsd[Transaction.transactionType.EXCHANGE].toFixed(2)}</div>
                      <div className="type-points">{reportData.summary.revenueByType[Transaction.transactionType.EXCHANGE].toLocaleString()} {t('common.diamonds')}</div>
                    </TransactionTypeDetails>
                  </TransactionTypeCard>

                  {/* Trading */}
                  <TransactionTypeCard>
                    <TransactionTypeIcon $bgColor="#B2F5EA" $iconColor="#319795">
                      <FaChartLine />
                    </TransactionTypeIcon>
                    <TransactionTypeDetails>
                      <div className="type-name">{t('dashboard.financialReports.trading')}</div>
                      <div className="type-amount">${reportData.summary.revenueByTypeUsd[Transaction.transactionType.TRADING].toFixed(2)}</div>
                      <div className="type-points">{reportData.summary.revenueByType[Transaction.transactionType.TRADING].toLocaleString()} {t('common.diamonds')}</div>
                    </TransactionTypeDetails>
                  </TransactionTypeCard>

                  {/* Payout Withdraw */}
                  <TransactionTypeCard>
                    <TransactionTypeIcon $bgColor="#FBD38D" $iconColor="#C05621">
                      <FaMoneyBillWave />
                    </TransactionTypeIcon>
                    <TransactionTypeDetails>
                      <div className="type-name">{t('dashboard.financialReports.payoutWithdraw')}</div>
                      <div className="type-amount">${reportData.summary.revenueByTypeUsd[Transaction.transactionType.PAYOUT_WITHDRAW].toFixed(2)}</div>
                      <div className="type-points">{reportData.summary.revenueByType[Transaction.transactionType.PAYOUT_WITHDRAW].toLocaleString()} {t('common.diamonds')}</div>
                    </TransactionTypeDetails>
                  </TransactionTypeCard>
                </TransactionTypeCards>
              </ModernStatsContainer>
              

            </ReportContent>
          </ReportCard>
          
          <ReportCard>
            <ReportHeader>
              <h2>
                <FaMoneyBillWave />
                {t('dashboard.financialReports.transactionHistory')}
              </h2>
            </ReportHeader>
            <ReportContent>
              <TableContainer>
                <Table>
                  <thead>
                    <tr>
                      <th>{t('dashboard.financialReports.date')}</th>
                      <th>{t('dashboard.financialReports.type')}</th>
                      <th>{t('dashboard.financialReports.from')}</th>
                      <th>{t('dashboard.financialReports.to')}</th>
                      <th className="amount">{t('dashboard.financialReports.diamonds')}</th>
                      <th className="amount">{t('dashboard.financialReports.usdAmount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.transactions.length > 0 ? (
                      reportData.transactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td>{transaction.date}</td>
                          <td>
                            <span className={`transaction-type ${transaction.typeClass}`}>
                              {transaction.translatedType}
                            </span>
                          </td>
                          <td>{transaction.authorName}</td>
                          <td>{transaction.receiverName}</td>
                          <td className="amount">{transaction.diamonds.toLocaleString()}</td>
                          <td className="amount">${transaction.usdAmount.toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="center">
                          {t('dashboard.financialReports.noTransactions')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </TableContainer>
            </ReportContent>
          </ReportCard>
        </>
      ) : (
        <NoDataMessage>
          <FaChartPie size={48} color="#CBD5E0" />
          <h3>{t('dashboard.financialReports.noData')}</h3>
          <p>{t('dashboard.financialReports.tryDifferentFilters')}</p>
        </NoDataMessage>
      )}
    </Container>
  );
};

export default FinancialReports;
