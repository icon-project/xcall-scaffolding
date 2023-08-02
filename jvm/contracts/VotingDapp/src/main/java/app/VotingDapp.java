package app;

import score.Address;
import score.Context;
import score.VarDB;
import score.annotation.EventLog;
import score.annotation.External;
import score.annotation.Optional;
import score.annotation.Payable;
import scorex.util.HashMap;

import java.math.BigInteger;
import java.util.Map;

public class VotingDapp {
    private final VarDB<BigInteger> countOfYes = Context.newVarDB("yes", BigInteger.class);
    private final VarDB<BigInteger> countOfNo = Context.newVarDB("no", BigInteger.class);
    private final VarDB<String> destinationBtpAddress = Context.newVarDB("btpAddress", String.class);
    private final VarDB<Address> xcallContractAddress = Context.newVarDB("xcall", Address.class);

    private static final String ROLLBACK_YES = "voteYesRollback";
    private static final String PAYLOAD_YES = "voteYes";
    private static final String ROLLBACK_NO = "voteNoRollback";
    private static final String PAYLOAD_NO = "voteNo";

    private final VarDB<String> rollbackYes = Context.newVarDB(ROLLBACK_YES, String.class);
    private final VarDB<String> payloadYes = Context.newVarDB(PAYLOAD_YES, String.class);
    private final VarDB<String> rollbackNo = Context.newVarDB(ROLLBACK_NO, String.class);
    private final VarDB<String> payloadNo = Context.newVarDB(PAYLOAD_NO, String.class);

    public VotingDapp(Address _sourceXCallContract, String _destinationBtpAddress) {
        this.destinationBtpAddress.set(_destinationBtpAddress);
        this.xcallContractAddress.set(_sourceXCallContract);
        this.countOfNo.set(BigInteger.ZERO);
        this.countOfYes.set(BigInteger.ZERO);
        this.payloadYes.set(PAYLOAD_YES);
        this.payloadNo.set(PAYLOAD_NO);
        this.rollbackYes.set(ROLLBACK_YES);
        this.rollbackNo.set(ROLLBACK_NO);
    }

    private BigInteger _sendCallMessage(byte[] _data, @Optional byte[] _rollback) {
        Address xcallSourceAddress = this.xcallContractAddress.get();
        String _to = this.destinationBtpAddress.get();
        return Context.call(BigInteger.class, Context.getValue(), xcallSourceAddress, "sendCallMessage", _to, _data, _rollback);
    }

    @Payable
    @External
    public void voteYes() {
        // Increase local count of Yes votes
        BigInteger sum = this.countOfYes.get().add(BigInteger.ONE);
        this.countOfYes.set(sum);

        // // make call to xcall
        byte[] bytePayload = this.payloadYes.get().getBytes();
        byte[] byteRollback = this.rollbackYes.get().getBytes();

        BigInteger id = _sendCallMessage(bytePayload, byteRollback);
        Context.println("sendCallMessage Response:" + id);
    }

    @Payable
    @External
    public void voteNo() {
        // Increase local count of No votes
        BigInteger sum = this.countOfNo.get().add(BigInteger.ONE);
        this.countOfNo.set(sum);

        // make call to xcall
        byte[] bytePayload = this.payloadNo.get().getBytes();
        byte[] byteRollback = this.rollbackNo.get().getBytes();

        BigInteger id = _sendCallMessage(bytePayload, byteRollback);
        Context.println("sendCallMessage Response:" + id);
    }

    @External(readonly = true)
    public Map<String, BigInteger> getVotes() {
        Map<String, BigInteger> votesMap = new HashMap<>();
        votesMap.put("yes", this.countOfYes.get());
        votesMap.put("no", this.countOfNo.get());
        return votesMap;
    }

    @External(readonly = true)
    public String getDestinationBtpAddress() {
        return this.destinationBtpAddress.get();
    }

    @External(readonly = true)
    public Address getXCallContractAddress() {
        return this.xcallContractAddress.get();
    }

    @Payable
    @External
    public void handleCallMessage(String _from, byte[] _data) {
        Address caller = Context.getCaller();
        String payload = new String(_data);
        Address xcallSourceAddress = this.xcallContractAddress.get();
        Context.println("handleCallMessage payload:" + payload);
        // If the caller is the xcall contract, then update the local count
        if (caller.equals(xcallSourceAddress)) {
            if (payload.equals(this.rollbackYes.get())) {
                BigInteger sum = this.countOfYes.get().subtract(BigInteger.ONE);
                this.countOfYes.set(sum);
            } else if (payload.equals(this.rollbackNo.get())) {
                BigInteger sum = this.countOfNo.get().subtract(BigInteger.ONE);
                this.countOfNo.set(sum);
            } else {
                Context.revert("Invalid payload for rollback");
            }
        } else {
            Context.revert("Unauthorized caller");
        }
        RollbackDataReceived(_from, _data);
    }

    @EventLog
    public void RollbackDataReceived(String _from, byte[] _rollback) {}
}
